# Greg Biles for CMPS165
# June 5, 2016
# creates an aggregate json object file containing all metrics for all candidates
# NOTE: algorithm for collection is completely un-optimized, may take some time for larger data sets

import csv
import json
import os
import pandas as pd
from dateutil import parser as dtp
from collections import defaultdict

# takes input from each 'variable' source file and returns
# json dict with aggregate data per 7day period 

candidates = ['trump', 'cruz', 'sanders', 'clinton']

columns = defaultdict(list)
data = {}
dons = {}
pollz = {}

# initializes candidate-specific data aggregation routine
for candidate in candidates:

    file = './aggregate/{}_7day.json'.format(candidate)

    # create file, close, in order to use append for rest of function
    if not os.path.exists(file):
        open(file, 'w').close()

    # appending all available info to dict, writes dict to file via json.dumps()
    with open(file, 'a') as f:

        # appends google trend info as a percentage of total at specified week during requested overall timeframe
        # as google does not give keyword metrics without access to adwords
        with open('./google/{}-google.csv'.format(candidate)) as dates:
            info = csv.DictReader(dates)
            for row in info:
                data[row["Week"][13:28]] = {"Google": int(row["{}".format(candidate)])}

        # appends facebook info in terms of total stories created about specified candidate
        # in the united states over past 7 day period
        with open('./facebook/fb-data/{}-fb.json'.format(candidate)) as file:
            fb_data = json.load(file)
            for item in fb_data:
                date = item[0]
                if date in data.keys():
                    data[date]["Facebook"] = item[1]

        # appends twitter info in terms of aggregate retweets for given candidate over
        # previous 7 day period
        with open('./twitter/twitter-data/{}-twtr.json'.format(candidate)) as t:
            twitter_data = json.load(t)
            for item in twitter_data:
                if item[0] in data.keys():
                    current = twitter_data.index(item)
                    retweets_thisweek = 0
                    for i in range(current-6, current):
                        if twitter_data[i]:
                            retweets_thisweek += int(twitter_data[i][1])
                    data[item[0]]["Twitter"] = retweets_thisweek

        # appends total accumulated donations over specified period using:
        # source: http://www.fec.gov/disclosurep/PDownload.do (FEC)
        with open('./donations/{}-donations.csv'.format(candidate)) as donations:
            donor_data = csv.DictReader(donations)
            for row in donor_data:
                parse_date = dtp.parse(row["contb_receipt_dt"])
                if parse_date.year == 2016:
                    don_date = '2016-{}-{}'.format(parse_date.month, parse_date.day)
                    if not don_date in dons:
                        dons[don_date] = float(row["contb_receipt_amt"])
                    else:
                        dons[don_date] += float(row["contb_receipt_amt"])
            for date in data.keys():
                prev_7days = pd.date_range(start=dtp.parse(date), periods=7).tolist()
                for contribution in dons.items():
                    if dtp.parse(contribution[0]) in prev_7days:
                        if not "Donations" in data[date]:
                            data[date]["Donations"] = float(contribution[1])
                        else:
                            data[date]["Donations"] += float(contribution[1])
                        data[date]["Donations"] = round(data[date]["Donations"], 2)

        # appends average polling information over 7 day period for given candidate using:
        # source: http://www.realclearpolitics.com/epolls/latest_polls/president/
        # --> navigate to party specific metrics for more straightforward data collection
        if candidates.index(candidate) < 2:
            poll_file = './polling/gop-polls.csv'
        else:
            poll_file = './polling/dem-polls.csv'

        with open(poll_file) as polls:
            poll_data = csv.DictReader(polls)
            for row in poll_data:
                formatted_date = '2016-{}-{}'.format(row["Date"][-5:-3], row["Date"][-2:])
                if not formatted_date in pollz:
                    pollz[formatted_date] = float(row['{}'.format(candidate)])
                else:
                    avg = (float(row['{}'.format(candidate)]) + pollz[formatted_date]) / 2
                    pollz[formatted_date] = avg
            for date in data.keys():
                prev_7days = pd.date_range(start=dtp.parse(date), periods=7).tolist()
                for poll in pollz.items():
                    if dtp.parse(poll[0]) in prev_7days:
                        if not "PollAvg" in data[date]:
                            data[date]["PollAvg"] = poll[1]
                        else:
                            data[date]["PollAvg"] = (poll[1] + data[date]["PollAvg"]) / 2
                        data[date]["PollAvg"] = round(data[date]["PollAvg"], 2)

        f.write(json.dumps(data))
        print("Finished aggregation for: " + candidate + " ...")

    f.close()
