import subprocess, sys

result = subprocess.run(
    ['npx', 'expo', 'login', '-u', '7rabah@gmail.com', '-p', 'Rabah06651024221997'],
    capture_output=False,
    text=True
)

sys.exit(result.returncode)