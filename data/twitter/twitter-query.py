#!/usr/bin/python
# Greg Biles for CMPS165 at UCSC

import tweepy as twitter
import os, json

# handle oauth/token and initialize api instance
auth = twitter.OAuthHandler(
	'1uv0DGZbLRXmRFqJkSosC2h0C',
	'e8rvx0aJsDDYa1iEEI1IcdfNTUQPLAHywizdUIpVMS7dlfiVfT')
auth.set_access_token(
	'3068732738-PPJT62vvdTz2srNT7O7e3dWmNbq0yAp1K0fJDfW',
	'gfk3PbOD1KoUOPY4tZUiaFDdLxhOUIcXSDXOHNbO73a9L'
	)
api = twitter.API(auth, wait_on_rate_limit=True) # 15min between api query @ 3200 tweets/candidate

candidates= {
	'trump':'realDonaldTrump',
	'clinton':'HillaryClinton',
	'sanders':'BernieSanders',
	'cruz':'tedcruz'
}

# get 
for profile in candidates.items():
	file = '{}-twtr.json'.format(profile[0])
	if not os.path.exists(file):
		open(file, 'w').close()
	with open(file, 'a') as f:
		can_dict = {}
		for status in twitter.Cursor(api.user_timeline, id=profile[1]).items(3200):
			date = (status.created_at).strftime("%Y-%m-%d")
			can_dict[date] = status.retweet_count + status.favorite_count
		can_dict = sorted(can_dict.items(), key=lambda t:t[0])
		f.write(json.dumps(can_dict))