import json
import random
import math

data = json.load(open('data/aggregate/trump_7day.json'))

streams = {s: [] for s in ['official', 'twitter', 'facebook', 'google', 'donations']}

for date in data:
    for stream in data[date]:
        streams[stream].append({
            "date": date,
            "value": data[date][stream]
        })

f = open('finalData.json', 'w+')
json.dump({"streams": streams}, f)

f.close()