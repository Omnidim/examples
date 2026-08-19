import json
from pathlib import Path
from urllib.request import Request, urlopen

fixture = Path(__file__).parents[1] / "fixtures" / "post-call.json"
request = Request(
    "http://localhost:8788/webhooks/omnidimension",
    data=fixture.read_bytes(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urlopen(request) as response:
    print(response.status, response.read().decode())
