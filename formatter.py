import json
import random
import math

data = json.load(open('fb_query/fb-data/trump.json'))


output = {
    "streams": {
        "official": [],
        "facebook": []
    }
}


last = 50



for entry in data:
    output["streams"]["facebook"].append({
        "date": entry[0],
        "value": entry[1]
    })

    last= random.randint(max(0, last-10), min(last+10, 100))
    output["streams"]["official"].append({
        "date": entry[0],
        "value": last
    })


f = open('data.json', 'w+')
json.dump(output, f)

f.close()