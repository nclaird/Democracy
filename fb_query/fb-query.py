#requires facepy
from facepy import GraphAPI
import json, requests, os, csv
from collections import OrderedDict

# FACEBOOK OAUTH / TOKEN REFRESH
def get_token(client_id, client_secret):
	payload = {
		'grant_type': 'client_credentials', 
		'client_id': client_id, 
		'client_secret': client_secret
	}
	file = requests.post('https://graph.facebook.com/oauth/access_token?', params = payload)
	return file.text.split("=")[1]
graph = GraphAPI(get_token('1611181372529273', '3781b31138b7dc4d6a3991b72f54e3da'))

# GRABBING DATA
candidates = {
	'trump':153080620724,
	'clinton':889307941125736,
	'sanders':124955570892789,
	'cruz':69983322463
	# to get data for more candidates, add their last name
	# and facebook id to this dict
}

# query only accepts 90 day intervals 
timeline = [
	('2016-02-01', '2016-04-30'),
	('2015-11-01', '2016-01-31'),
	('2015-08-01', '2015-10-31'),
]

# create file, query api, translate, zip, output
for profile in candidates.items():
	file = '{}.json'.format(profile[0])
	if not os.path.exists(file):
		open(file, 'w').close()
	with open(file, 'a') as f:
		can_dict = final_dict = {}
		for date in timeline:
			raw_data = graph.get('{}/insights/page_storytellers_by_country/week?debug=all&method=get&pretty=0&since={}&suppress_http_code=1&until={}'.format(profile[1], date[0], date[1]))
			ext_data = raw_data["data"][0]["values"]
			for i in range(0, len(ext_data)):
				intl = ext_data[i]["value"]
				can_dict[ext_data[i]["end_time"][:10]] = sum(intl.values())
		can_dict = sorted(can_dict.items(), key=lambda t:t[0])
		#for x in range(1, len(can_dict)-1):
			#if not x%7: can_dict.pop(x)
		f.write(json.dumps(can_dict))
print('done')