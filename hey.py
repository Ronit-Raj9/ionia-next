import os

def tree(dir_path, prefix=""):
    # Get a sorted list of files and directories
    entries = sorted(os.listdir(dir_path))
    entries_count = len(entries)

    for index, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        connector = "├── " if index < entries_count - 1 else "└── "

        print(prefix + connector + entry)

        if os.path.isdir(path):
            extension = "│   " if index < entries_count - 1 else "    "
            tree(path, prefix + extension)

if __name__ == "__main__":
    import sys

    # Use current directory or user-provided path
    base_path = "/home/raj/Documents/CODING/Ionia/ionia-next/PraisonAI"
    print(base_path)
    tree(base_path)
