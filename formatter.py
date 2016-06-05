import json
import random
import math

data = json.load(open('fb_query/fb-data/trump.json'))

streams = {s: 0 for s in ['official', 'twitter', 'facebook', 'donations']}

output = {
    "streams": {stream: [] for stream in streams}
}





for entry in data:

    for stream in streams:
        streams[stream] = random.randint(max(0, streams[stream]-10), min(streams[stream]+10, 100))
        output["streams"][stream].append({
            "date": entry[0],
            "value": streams[stream]
        })




f = open('data.json', 'w+')
json.dump(output, f)

f.close()