# praisonai/agents_generator.py

import sys
from .version import __version__
import yaml, os
from rich import print
from dotenv import load_dotenv
from .inbuilt_tools import *
from .inc import PraisonAIModel
import inspect
from pathlib import Path
import importlib
import importlib.util
import os
import logging

# Framework-specific imports with availability checks
PRAISONAI_AVAILABLE = False
AGENTOPS_AVAILABLE = False

try:
    from praisonaiagents import Agent as PraisonAgent, Task as PraisonTask, PraisonAIAgents
    PRAISONAI_AVAILABLE = True
except ImportError:
    pass

try:
    import agentops
    AGENTOPS_AVAILABLE = True
    AGENTOPS_API_KEY = os.getenv("AGENTOPS_API_KEY")
    if not AGENTOPS_API_KEY:
        AGENTOPS_AVAILABLE = False
except ImportError:
    pass

os.environ["OTEL_SDK_DISABLED"] = "true"

class AgentsGenerator:
    def __init__(self, agent_file, framework, config_list, log_level=None, agent_callback=None, task_callback=None, agent_yaml=None, tools=None):
        """
        Initialize the AgentsGenerator object.

        Parameters:
            agent_file (str): The path to the agent file.
            framework (str): The framework to be used for the agents.
            config_list (list): A list of configurations for the agents.
            log_level (int, optional): The logging level to use. Defaults to logging.INFO.
            agent_callback (callable, optional): A callback function to be executed after each agent step.
            task_callback (callable, optional): A callback function to be executed after each tool run.
            agent_yaml (str, optional): The content of the YAML file. Defaults to None.
            tools (dict, optional): A dictionary containing the tools to be used for the agents. Defaults to None.

        Attributes:
            agent_file (str): The path to the agent file.
            framework (str): The framework to be used for the agents.
            config_list (list): A list of configurations for the agents.
            log_level (int): The logging level to use.
            agent_callback (callable, optional): A callback function to be executed after each agent step.
            task_callback (callable, optional): A callback function to be executed after each tool run.
            tools (dict): A dictionary containing the tools to be used for the agents.
        """
        self.agent_file = agent_file
        self.framework = framework
        self.config_list = config_list
        self.log_level = log_level
        self.agent_callback = agent_callback
        self.task_callback = task_callback
        self.agent_yaml = agent_yaml
        self.tools = tools or []  # Store tool class names as a list
        self.log_level = log_level or logging.getLogger().getEffectiveLevel()
        if self.log_level == logging.NOTSET:
            self.log_level = os.environ.get('LOGLEVEL', 'INFO').upper()
        
        logging.basicConfig(level=self.log_level, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(self.log_level)
        
        # Validate framework availability
        if framework != "praisonai":
            raise ValueError("Only 'praisonai' framework is supported. Other frameworks have been removed.")
        if not PRAISONAI_AVAILABLE:
            raise ImportError("PraisonAI is not installed. Please install it with 'pip install praisonaiagents'")

    def is_function_or_decorated(self, obj):
        """
        Checks if the given object is a function or has a __call__ method.

        Parameters:
            obj (object): The object to be checked.

        Returns:
            bool: True if the object is a function or has a __call__ method, False otherwise.
        """
        return inspect.isfunction(obj) or hasattr(obj, '__call__')

    def load_tools_from_module(self, module_path):
        """
        Loads tools from a specified module path.

        Parameters:
            module_path (str): The path to the module containing the tools.

        Returns:
            dict: A dictionary containing the names of the tools as keys and the corresponding functions or objects as values.

        Raises:
            FileNotFoundError: If the specified module path does not exist.
        """
        spec = importlib.util.spec_from_file_location("tools_module", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return {name: obj for name, obj in inspect.getmembers(module, self.is_function_or_decorated)}
    
    def load_tools_from_module_class(self, module_path):
        """
        Loads tools from a specified module path containing classes that inherit from BaseTool 
        or are part of langchain_community.tools package.
        """
        spec = importlib.util.spec_from_file_location("tools_module", module_path)
        module = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)
            return {name: obj() for name, obj in inspect.getmembers(module, 
                lambda x: inspect.isclass(x) and (
                    x.__module__.startswith('langchain_community.tools') or 
                    (PRAISONAI_TOOLS_AVAILABLE and issubclass(x, BaseTool))
                ) and x is not BaseTool)}
        except ImportError as e:
            self.logger.warning(f"Error loading tools from {module_path}: {e}")
            return {}

    def load_tools_from_package(self, package_path):
        """
        Loads tools from a specified package path containing modules with functions or classes.

        Parameters:
            package_path (str): The path to the package containing the tools.

        Returns:
            dict: A dictionary containing the names of the tools as keys and the corresponding initialized instances of the classes as values.

        Raises:
            FileNotFoundError: If the specified package path does not exist.

        This function iterates through all the .py files in the specified package path, excluding those that start with "__". For each file, it imports the corresponding module and checks if it contains any functions or classes that can be loaded as tools. The function then returns a dictionary containing the names of the tools as keys and the corresponding initialized instances of the classes as values.
        """
        tools_dict = {}
        for module_file in os.listdir(package_path):
            if module_file.endswith('.py') and not module_file.startswith('__'):
                module_name = f"{package_path.name}.{module_file[:-3]}"  # Remove .py for import
                module = importlib.import_module(module_name)
                for name, obj in inspect.getmembers(module, self.is_function_or_decorated):
                    tools_dict[name] = obj
        return tools_dict

    def load_tools_from_tools_py(self):
        """
        Imports and returns all contents from tools.py file.
        Also adds the tools to the global namespace.

        Returns:
            list: A list of callable functions with proper formatting
        """
        tools_list = []
        try:
            # Try to import tools.py from current directory
            spec = importlib.util.spec_from_file_location("tools", "tools.py")
            self.logger.debug(f"Spec: {spec}")
            if spec is None:
                self.logger.debug("tools.py not found in current directory")
                return tools_list

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Get all module attributes except private ones and classes
            for name, obj in inspect.getmembers(module):
                if (not name.startswith('_') and 
                    callable(obj) and 
                    not inspect.isclass(obj)):
                    # Add the function to global namespace
                    globals()[name] = obj
                    # Add to tools list
                    tools_list.append(obj)
                    self.logger.debug(f"Loaded and globalized tool function: {name}")

            self.logger.debug(f"Loaded {len(tools_list)} tool functions from tools.py")
            self.logger.debug(f"Tools list: {tools_list}")
            
        except FileNotFoundError:
            self.logger.debug("tools.py not found in current directory")
        except Exception as e:
            self.logger.warning(f"Error loading tools from tools.py: {e}")
            
        return tools_list

    def generate_crew_and_kickoff(self):
        """
        Generates a crew of agents and initiates tasks based on the provided configuration.

        Parameters:
            agent_file (str): The path to the agent file.
            framework (str): The framework to be used for the agents.
            config_list (list): A list of configurations for the agents.

        Returns:
            str: The output of the tasks performed by the crew of agents.

        Raises:
            FileNotFoundError: If the specified agent file does not exist.

        This function loads the agent configuration from the specified file, initializes the tools required for the agents, creates PraisonAI agents for each role in the configuration, and initiates tasks using the PraisonAI framework.
        """
        if self.agent_yaml:
            config = yaml.safe_load(self.agent_yaml)
        else:
            if self.agent_file == '/app/api:app' or self.agent_file == 'api:app':
                self.agent_file = 'agents.yaml'
            try:
                with open(self.agent_file, 'r') as f:
                    config = yaml.safe_load(f)
            except FileNotFoundError:
                print(f"File not found: {self.agent_file}")
                return

        topic = config['topic']
        tools_dict = {}

        root_directory = os.getcwd()
        tools_py_path = os.path.join(root_directory, 'tools.py')
        tools_dir_path = Path(root_directory) / 'tools'
        
        if os.path.isfile(tools_py_path):
            tools_dict.update(self.load_tools_from_module_class(tools_py_path))
            self.logger.debug("tools.py exists in the root directory. Loading tools.py and skipping tools folder.")
        elif tools_dir_path.is_dir():
            tools_dict.update(self.load_tools_from_module_class(tools_dir_path))
            self.logger.debug("tools folder exists in the root directory")

        framework = self.framework or config.get('framework', 'praisonai')

        if framework != "praisonai":
            raise ValueError("Only 'praisonai' framework is supported. Other frameworks have been removed.")
            
        if not PRAISONAI_AVAILABLE:
            raise ImportError("PraisonAI is not installed. Please install it with 'pip install praisonaiagents'")
        if AGENTOPS_AVAILABLE:
            agentops.init(os.environ.get("AGENTOPS_API_KEY"), default_tags=["praisonai"])
        return self._run_praisonai(config, topic, tools_dict)

    def _run_praisonai(self, config, topic, tools_dict):
        """
        Run agents using the PraisonAI framework.
        """
        agents = {}
        tasks = []
        tasks_dict = {}

        # Load tools once at the beginning
        tools_list = self.load_tools_from_tools_py()
        self.logger.debug(f"Loaded tools: {tools_list}")

        # Create agents from config
        for role, details in config['roles'].items():
            role_filled = details['role'].format(topic=topic)
            goal_filled = details['goal'].format(topic=topic)
            backstory_filled = details['backstory'].format(topic=topic)
            
            # Pass all loaded tools to the agent
            agent = PraisonAgent(
                name=role_filled,
                role=role_filled,
                goal=goal_filled,
                backstory=backstory_filled,
                tools=tools_list,  # Pass the entire tools list to the agent
                allow_delegation=details.get('allow_delegation', False),
                llm=details.get('llm', {}).get("model") or os.environ.get("MODEL_NAME") or "openai/gpt-5-nano",
                function_calling_llm=details.get('function_calling_llm', {}).get("model") or os.environ.get("MODEL_NAME") or "openai/gpt-5-nano",
                max_iter=details.get('max_iter', 15),
                max_rpm=details.get('max_rpm'),
                max_execution_time=details.get('max_execution_time'),
                verbose=details.get('verbose', True),
                cache=details.get('cache', True),
                system_template=details.get('system_template'),
                prompt_template=details.get('prompt_template'),
                response_template=details.get('response_template'),
                reflect_llm=details.get('reflect_llm', {}).get("model") or os.environ.get("MODEL_NAME") or "openai/gpt-5-nano",
                min_reflect=details.get('min_reflect', 1),
                max_reflect=details.get('max_reflect', 3),
            )
            
            if self.agent_callback:
                agent.step_callback = self.agent_callback

            agents[role] = agent
            self.logger.debug(f"Created agent {role_filled} with tools: {agent.tools}")

            # Create tasks for the agent
            for task_name, task_details in details.get('tasks', {}).items():
                description_filled = task_details['description'].format(topic=topic)
                expected_output_filled = task_details['expected_output'].format(topic=topic)

                task = PraisonTask(
                    description=description_filled,
                    expected_output=expected_output_filled,
                    agent=agent,
                    tools=tools_list,  # Pass the same tools list to the task
                    async_execution=task_details.get('async_execution', False),
                    context=[],
                    config=task_details.get('config', {}),
                    output_json=task_details.get('output_json'),
                    output_pydantic=task_details.get('output_pydantic'),
                    output_file=task_details.get('output_file', ""),
                    callback=task_details.get('callback'),
                    create_directory=task_details.get('create_directory', False)
                )

                self.logger.debug(f"Created task {task_name} with tools: {task.tools}")
                
                if self.task_callback:
                    task.callback = self.task_callback

                tasks.append(task)
                tasks_dict[task_name] = task

        # Set up task contexts
        for role, details in config['roles'].items():
            for task_name, task_details in details.get('tasks', {}).items():
                task = tasks_dict[task_name]
                context_tasks = [tasks_dict[ctx] for ctx in task_details.get('context', []) 
                            if ctx in tasks_dict]
                task.context = context_tasks

        # Create and run the PraisonAI agents
        memory = config.get('memory', False)
        self.logger.debug(f"Memory: {memory}")
        if config.get('process') == 'hierarchical':
            agents = PraisonAIAgents(
                agents=list(agents.values()),
                tasks=tasks,
                verbose=True,
                process="hierarchical",
                manager_llm=config.get('manager_llm') or os.environ.get("MODEL_NAME") or "openai/gpt-5-nano",
                memory=memory
            )
        else:
            agents = PraisonAIAgents(
                agents=list(agents.values()),
                tasks=tasks,
                verbose=True,
                memory=memory
            )

        self.logger.debug("Final Configuration:")
        self.logger.debug(f"Agents: {agents.agents}")
        self.logger.debug(f"Tasks: {agents.tasks}")

        response = agents.start()
        self.logger.debug(f"Result: {response}")
        result = ""
        
        if AGENTOPS_AVAILABLE:
            agentops.end_session("Success")
            
        return result