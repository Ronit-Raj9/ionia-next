// Question types
export const QUESTION_TYPES = [
  { value: "single", label: "Single Choice" },
  { value: "multiple", label: "Multiple Choice" },
  { value: "numerical", label: "Numerical Answer" }
];

// Exam types
export const EXAM_TYPES = [
  { value: "jee_main", label: "JEE Main" },
  { value: "jee_adv", label: "JEE Advanced" },
  { value: "cuet", label: "CUET" },
  { value: "neet", label: "NEET" },
  { value: "cbse_11", label: "CBSE Class 11" },
  { value: "cbse_12", label: "CBSE Class 12" },
  { value: "none", label: "None/Other" }
];

// Class options
export const CLASS_OPTIONS = [
  { value: 'class_9', label: 'Class 9' },
  { value: 'class_10', label: 'Class 10' },
  { value: 'class_11', label: 'Class 11' },
  { value: 'class_12', label: 'Class 12' },
  { value: 'none', label: 'None/Other' }
];

// Class values
export const CLASS_VALUES = [
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
];

// All available subjects (combined from all exam types)
export const SUBJECTS = [
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "mathematics", label: "Mathematics" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "social_science", label: "Social Science" },
  { value: "computer_science", label: "Computer Science" },
  { value: "information_practice", label: "Information Practice" },
  { value: "history", label: "History" },
  { value: "civics", label: "Civics" },
  { value: "geography", label: "Geography" },
  { value: "general_test", label: "General Test" },
  { value: "general_knowledge", label: "General Knowledge" },
];

// Subject values (will be filtered by exam type)
export const SUBJECT_VALUES = {
  jee_main: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
  ],
  jee_adv: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
  ],
  neet: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "biology", label: "Biology" },
  ],
  cbse_11: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
    { value: "biology", label: "Biology" },
    { value: "english", label: "English" },
    { value: "social_science", label: "Social Science" },
    { value: "computer_science", label: "Computer Science" },
    { value: "information_practice", label: "Information Practice" },
    { value: "history", label: "History" },
    { value: "civics", label: "Civics" },
    { value: "geography", label: "Geography" },
    ],
  cbse_12: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
    { value: "biology", label: "Biology" },
    { value: "english", label: "English" },
    { value: "social_science", label: "Social Science" },
    { value: "computer_science", label: "Computer Science" },
    { value: "information_practice", label: "Information Practice" },
    { value: "history", label: "History" },
    { value: "civics", label: "Civics" },
    { value: "geography", label: "Geography" },
    ],
  cuet: [
    { value: "general_test", label: "General Test" },
    { value: "english", label: "English" },
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
    { value: "biology", label: "Biology" }
  ],
  none: [
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "mathematics", label: "Mathematics" },
    { value: "biology", label: "Biology" },
    { value: "english", label: "English" },
    { value: "general_test", label: "General Test" }
  ]
};

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

// Language levels
export const LANGUAGE_LEVELS = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Languages
export const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
];

// Question categories
export const QUESTION_CATEGORIES = [
  { value: "theoretical", label: "Theoretical" },
  { value: "numerical", label: "Numerical" }
];

// Question sources
export const QUESTION_SOURCES = [
  { value: "custom", label: "Custom (Our Team)" },
  { value: "pyq", label: "Previous Year Question" },
  { value: "india_book", label: "Indian Book" },
  { value: "foreign_book", label: "Foreign Book" }
];

// Form steps
export const FORM_STEPS = [
  { title: "Question Content", description: "Enter the main question", isValid: true },
  { title: "Details & Classification", description: "Set question attributes", isValid: true },
  { title: "Solution & Hints", description: "Add solution and optional hints", isValid: true },
  { title: "Tags & Topics", description: "Categorize with keywords", isValid: true },
];

// Physics curriculum organized by class, section, and chapters
export const PHYSICS_CURRICULUM = {
  "class_11": {
    "mechanics": [
      "Kinematics",
      "Laws of Motion",
      "Work, Energy, and Power",
      "Rotational Motion",
      "Gravitation",
      "Properties of Matter (Elasticity, Surface Tension)",
      "Fluid Mechanics",
      "Mechanical Waves and Sound"
    ],
    "thermodynamics": [
      "Thermal Properties of Matter",
      "Laws of Thermodynamics",
      "Heat Transfer (Conduction, Convection, Radiation)"
    ],
    "optics": [
      "Reflection and Refraction of Light",
      "Plane and Spherical Mirrors",
      "Lenses and Optical Instruments"
    ]
  },
  "class_12": {
    "electromagnetism": [
      "Electric Charges and Fields",
      "Electrostatics",
      "Current Electricity",
      "Magnetism and Magnetic Effects of Current",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves"
    ],
    "optics": [
      "Wave Optics (Interference, Diffraction, Polarization)",
      "Ray Optics (Reflection, Refraction, Lenses, Mirrors)"
    ],
    "modern_physics": [
      "Dual Nature of Matter and Radiation",
      "Photoelectric Effect",
      "Atomic Models",
      "Nuclear Physics",
      "Semiconductor Devices and Electronics"
    ],
    "thermodynamics": [
      "Carnot Engine",
      "Entropy",
      "Heat Engines and Refrigerators"
    ]
  }
} as const;

// Chemistry curriculum organized by class, section, and chapters
export const CHEMISTRY_CURRICULUM = {
  "class_11": {
    "physical": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
      "States of Matter (Gases and Liquids)",
      "Thermodynamics",
      "Equilibrium (Chemical and Ionic)",
      "Redox Reactions"
    ],
    "inorganic": [
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
      "Hydrogen",
      "The s-Block Element (Alkali and Alkaline Earth Metals)",
      "Some p-Block Elements",
      "Environmental Chemistry"
    ],
    "organic": [
      "Some Basic Principles and Techniques of Organic Chemistry",
      "Hydrocarbons (Alkanes, Alkenes, Alkynes, and Aromatic Hydrocarbons)"
    ],
    "analytical": [
      "Basic Quantitative and Qualitative Analysis",
      "Concentration Terms (Molarity, Normality, etc.)",
      "Empirical and Molecular Formula Determination"
    ]
  },
  "class_12": {
    "physical": [
      "Solid State",
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "Surface Chemistry",
      "Thermodynamics (Advanced Concepts)"
    ],
    "inorganic": [
      "General Principles and Processes of Isolation of Elements",
      "The p-Block Element (Group 15, 16, 17, 18)",
      "The d-Block Element (Transition Elements)",
      "The f-Block Element (Lanthanides and Actinides)",
      "Coordination Compounds",
      "Qualitative Analysis of Inorganic Compounds"
    ],
    "organic": [
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols, and Ethers",
      "Aldehydes, Ketones, and Carboxylic Acids",
      "Organic Compounds Containing Nitrogen",
      "Biomolecules (Carbohydrates, Proteins, Nucleic Acids)",
      "Polymers",
      "Chemistry in Everyday Life"
    ],
    "analytical": [
      "Titration Methods (Acid-Base, Redox, Complexometric)",
      "Chromatography (Paper, Thin Layer, Gas, HPLC)"
    ]
  }
} as const;

// Biology curriculum organized by class, section, and chapters
export const BIOLOGY_CURRICULUM = {
  "class_11": {
    "botany": [
      "The Living World",
      "Plant Kingdom",
      "Morphology of Flowering Plants",
      "Anatomy of Flowering Plants",
      "Transport in Plants",
      "Mineral Nutrition",
      "Photosynthesis in Higher Plants",
      "Respiration in Plants",
      "Plant Growth and Development"
    ],
    "zoology": [
      "Animal Kingdom",
      "Structural Organisation in Animals",
      "Digestion and Absorption",
      "Breathing and Exchange of Gases",
      "Body Fluids and Circulation",
      "Excretory Products and Their Elimination",
      "Locomotion and Movement"
    ],
    "human_physiology": [
      "Neural Control and Coordination",
      "Chemical Coordination and Integration"
    ],
    "ecology": [
      "Biological Classification"
    ],
    "genetics": [
      "Cell The Unit of Life",
      "Biomolecules",
      "Cell Cycle and Cell Division"
    ]
  },
  "class_12": {
    "botany": [
      "Reproduction in Organisms",
      "Sexual Reproduction in Flowering Plants"
    ],
    "zoology": [
      "Human Reproduction",
      "Reproductive Health"
    ],
    "human_physiology": [
      "Human Health and Disease",
      "Microbes in Human Welfare",
      "Strategies for Enhancement in Food Production"
    ],
    "ecology": [
      "Organisms and Populations",
      "Ecosystem",
      "Biodiversity and Conservation",
      "Environmental Issues"
    ],
    "genetics": [
      "Principles of Inheritance and Variation",
      "Molecular Basis of Inheritance",
      "Evolution",
      "Biotechnology: Principles and Processes",
      "Biotechnology and Its Applications"
    ]
  }
} as const;

// English curriculum organized by class, section, and chapters
export const ENGLISH_CURRICULUM = {
  "class_11": {
    "reading_comprehension": [
      "Analyzing Factual Information",
      "Summarizing Key Points",
      "Identifying Supporting Details",
      "Understanding Plot and Characters",
      "Analyzing Themes and Motifs"
    ],
    "vocabulary": [
      "Common Words and Phrases",
      "Synonyms and Antonyms",
      "Homophones and Homonyms",
      "Prefixes and Suffixes",
      "Root Words"
    ],
    "grammar": [
      "Nouns (Countable, Uncountable, Abstract, Collective)",
      "Verbs (Regular, Irregular, Transitive, Intransitive)",
      "Adjectives (Comparative, Superlative)",
      "Adverbs",
      "Pronouns"
    ],
    "writing": [
      "Essay Writing",
      "Letter Writing",
      "Report Writing",
      "Creative Writing",
      "Summary Writing"
    ]
  },
  "class_12": {
    "reading_comprehension": [
      "Recognizing Narrative Techniques",
      "Appreciating Literary Devices",
      "Analyzing Poetry and Prose",
      "Interpreting Symbolism and Metaphors",
      "Critical Reading and Analysis"
    ],
    "vocabulary": [
      "Compounds and Blends",
      "Collocations",
      "Idioms and Phrasal Verbs",
      "Technical and Subject-Specific Vocabulary",
      "Academic and Formal Vocabulary"
    ],
    "grammar": [
      "Advanced Sentence Structure",
      "Prepositions",
      "Conjunctions",
      "Interjections",
      "Tenses and Their Usage"
    ],
    "writing": [
      "Academic Writing",
      "Research Papers",
      "Argumentative Essays",
      "Descriptive Writing",
      "Narrative Writing"
    ]
  }
} as const;

// General Test curriculum organized by sections and chapters
export const GENERAL_TEST_CURRICULUM = {
  "class_11": {
    "gk": [],
    "current_affairs": [],
    "general_science": [],
    "logical_reasoning": [
      "Series",
      "Analogy & Classification",
      "Coding Decoding",
      "Direction Test",
      "Ranking Test",
      "Blood Relation",
      "Syllogism",
      "Logical Venn Diagram",
      "Clock & Calendar",
      "Coded Inequality",
      "Input Output",
      "Puzzle",
      "Fictitious Symbol"
    ],
    "mathematical_reasoning": [
      "Simplification",
      "Number Series",
      "Ratio and Proportion",
      "Percentage",
      "Profit and Loss",
      "Average",
      "Lines and Angle",
      "Area, Volume, CSA and TSA",
      "Triangle and Quadrilateral",
      "Data Interpretation",
      "Mean, Median and Mode",
      "Algebra",
      "Problem on Edges",
      "Mixture & Alligation",
      "Time & Work",
      "Pipe & Cistern",
      "Speed, Time & Distance",
      "Problem Based on Trains",
      "Boat & Stream"
    ]
  },
  "class_12": {
    "gk": [],
    "current_affairs": [],
    "general_science": [],
    "logical_reasoning": [
      "Series",
      "Analogy & Classification",
      "Coding Decoding",
      "Direction Test",
      "Ranking Test",
      "Blood Relation",
      "Syllogism",
      "Logical Venn Diagram",
      "Clock & Calendar",
      "Coded Inequality",
      "Input Output",
      "Puzzle",
      "Fictitious Symbol"
    ],
    "mathematical_reasoning": [
      "Simplification",
      "Number Series",
      "Ratio and Proportion",
      "Percentage",
      "Profit and Loss",
      "Average",
      "Lines and Angle",
      "Area, Volume, CSA and TSA",
      "Triangle and Quadrilateral",
      "Data Interpretation",
      "Mean, Median and Mode",
      "Algebra",
      "Problem on Edges",
      "Mixture & Alligation",
      "Time & Work",
      "Pipe & Cistern",
      "Speed, Time & Distance",
      "Problem Based on Trains",
      "Boat & Stream"
    ]
  }
} as const;

// Section name mapping
export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  // Physics sections
  "mechanics": "Mechanics",
  "thermodynamics": "Thermodynamics",
  "optics": "Optics",
  "electromagnetism": "Electromagnetism",
  "modern_physics": "Modern Physics",
  
  // Chemistry sections
  "physical": "Physical Chemistry",
  "inorganic": "Inorganic Chemistry",
  "organic": "Organic Chemistry",
  "analytical": "Analytical Chemistry",
  
  // Biology sections
  "botany": "Botany",
  "zoology": "Zoology",
  "human_physiology": "Human Physiology",
  "ecology": "Ecology & Environment",
  "genetics": "Genetics & Biotechnology",
  
  // English sections
  "reading_comprehension": "Reading Comprehension",
  "vocabulary": "Vocabulary",
  "grammar": "Grammar",
  "writing": "Writing",
  
  // General Test sections
  "gk": "General Knowledge",
  "current_affairs": "Current Affairs",
  "general_science": "General Science",
  "logical_reasoning": "Logical Reasoning",
  "mathematical_reasoning": "Mathematical Reasoning"
};

// Subject section map
export const SUBJECT_SECTION_MAP: Record<string, string[]> = {
  "physics": ["mechanics", "electromagnetism", "thermodynamics", "optics", "modern_physics", "none"],
  "chemistry": ["organic", "inorganic", "physical", "analytical", "none"],
  "mathematics": ["algebra", "calculus", "geometry", "statistics", "trigonometry", "none"],
  "general_test": ["gk", "current_affairs", "general_science", "mathematical_reasoning", "logical_reasoning", "none"],
  "english": ["reading_comprehension", "vocabulary", "grammar", "writing", "none"],
  "biology": ["botany", "zoology", "human_physiology", "ecology", "genetics", "none"]
};

// Years for questions (past to current)
export const YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => String(1990 + i));

// Section options for each subject (used in form UI)
export const PHYSICS_SECTIONS = [
  { value: 'mechanics', label: 'Mechanics' },
  { value: 'electromagnetism', label: 'Electromagnetism' },
  { value: 'thermodynamics', label: 'Thermodynamics' },
  { value: 'optics', label: 'Optics' },
  { value: 'modern_physics', label: 'Modern Physics' },
  { value: 'none', label: 'None' }
];

export const CHEMISTRY_SECTIONS = [
  { value: 'organic', label: 'Organic Chemistry' },
  { value: 'inorganic', label: 'Inorganic Chemistry' },
  { value: 'physical', label: 'Physical Chemistry' },
  { value: 'analytical', label: 'Analytical Chemistry' },
  { value: 'none', label: 'None' }
];

export const MATHEMATICS_SECTIONS = [
  { value: 'algebra', label: 'Algebra' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'trigonometry', label: 'Trigonometry' },
  { value: 'none', label: 'None' }
];

export const GENERAL_TEST_SECTIONS = [
  { value: 'gk', label: 'General Knowledge' },
  { value: 'current_affairs', label: 'Current Affairs' },
  { value: 'general_science', label: 'General Science' },
  { value: 'mathematical_reasoning', label: 'Mathematical Reasoning' },
  { value: 'logical_reasoning', label: 'Logical Reasoning' },
  { value: 'none', label: 'None' }
];

export const ENGLISH_SECTIONS = [
  { value: 'reading_comprehension', label: 'Reading Comprehension' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'writing', label: 'Writing' },
  { value: 'none', label: 'None' }
];

export const BIOLOGY_SECTIONS = [
  { value: 'botany', label: 'Botany' },
  { value: 'zoology', label: 'Zoology' },
  { value: 'human_physiology', label: 'Human Physiology' },
  { value: 'ecology', label: 'Ecology' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'none', label: 'None' }
];

// Helper function to get sections based on subject
export const getSubjectSections = (subject: string) => {
  switch (subject.toLowerCase()) {
    case 'physics':
      return PHYSICS_SECTIONS;
    case 'chemistry':
      return CHEMISTRY_SECTIONS;
    case 'mathematics':
      return MATHEMATICS_SECTIONS;
    case 'general_test':
      return GENERAL_TEST_SECTIONS;
    case 'english':
      return ENGLISH_SECTIONS;
    case 'biology':
      return BIOLOGY_SECTIONS;
    default:
      return [];
  }
}; 

// Helper function to get chapters based on subject, class and section
export const getChaptersForSubject = (subject: string, classValue: string, section: string) => {
  // Default empty array
  if (!subject || !classValue || !section || section === 'none') {
    return [];
  }

  try {
    // Convert class value to the correct format (class_11 or class_12)
    const normalizedClass = classValue.includes('class_') ? classValue : `class_${classValue.replace('class_', '')}`;

    // Get the appropriate curriculum based on subject
    let curriculum: any;
    switch (subject.toLowerCase()) {
      case 'physics':
        curriculum = PHYSICS_CURRICULUM;
        break;
      case 'chemistry':
        curriculum = CHEMISTRY_CURRICULUM;
        break;
      case 'biology':
        curriculum = BIOLOGY_CURRICULUM;
        break;
      case 'mathematics':
        // Add dummy chapters for mathematics since we don't have a curriculum yet
        return getMathChapters(normalizedClass, section);
      case 'english':
        curriculum = ENGLISH_CURRICULUM;
        break;
      case 'general_test':
        curriculum = GENERAL_TEST_CURRICULUM;
        break;
      default:
        // For other subjects, return empty array
        return [];
    }

    // Check if there are chapters for this class and section
    if (curriculum[normalizedClass as keyof typeof curriculum]?.[section as any]) {
      const chapters = curriculum[normalizedClass as keyof typeof curriculum][section as any] as string[];
      
      // If empty array (like for GK and General Science), return empty array
      if (chapters.length === 0) {
        return [];
      }
      
      return chapters.map((chapter: string) => ({
        value: chapter,
        label: chapter
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error getting chapters:", error);
    return [];
  }
};

// Helper function to provide dummy mathematics chapters
const getMathChapters = (classValue: string, section: string): Array<{value: string, label: string}> => {
  // Define chapters for mathematics sections
  const mathChapters: Record<string, Record<string, string[]>> = {
    'class_11': {
      'algebra': [
        'Sets, Relations and Functions',
        'Complex Numbers',
        'Sequences and Series',
        'Permutations and Combinations',
        'Binomial Theorem',
        'Mathematical Induction'
      ],
      'calculus': [
        'Limits and Derivatives',
        'Continuity and Differentiability',
        'Applications of Derivatives',
        'Integrals',
        'Applications of Integrals'
      ],
      'geometry': [
        'Coordinate Geometry',
        'Straight Lines',
        'Circles',
        'Conic Sections'
      ],
      'statistics': [
        'Measures of Central Tendency',
        'Measures of Dispersion',
        'Probability',
        'Random Variables'
      ],
      'trigonometry': [
        'Trigonometric Functions',
        'Trigonometric Equations',
        'Inverse Trigonometric Functions',
        'Heights and Distances'
      ]
    },
    'class_12': {
      'algebra': [
        'Matrices and Determinants',
        'Boolean Algebra',
        'Linear Programming'
      ],
      'calculus': [
        'Differentiation',
        'Applications of Derivatives',
        'Integration',
        'Definite Integrals',
        'Differential Equations'
      ],
      'geometry': [
        '3D Geometry',
        'Vector Algebra'
      ],
      'statistics': [
        'Probability Distributions',
        'Bernoulli Trials',
        'Binomial Distribution',
        'Correlation and Regression'
      ],
      'trigonometry': [
        'Properties of Triangles',
        'Advanced Trigonometric Identities'
      ]
    }
  };

  // Return chapters for the specified class and section
  if (mathChapters[classValue]?.[section]) {
    return mathChapters[classValue][section].map(chapter => ({
      value: chapter,
      label: chapter
    }));
  }

  return [];
}; 