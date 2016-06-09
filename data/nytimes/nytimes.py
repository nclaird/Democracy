import requests
import json
dateT = '20160104'
#payload = {'q': 'Bernie sanders', 'fq': 'headline:sanders','fl': "pub_date,headline,web_url", 'end_date': dateT }
#headers = { 'apikey': 'ee15d3b7ab684613b16e22d82e8e1cc2'}
#url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
#r = requests.get(url, headers = headers, params = payload)
#jsonData = r.json()
list1 = []


datesT = [20160104,20160111,20160118,20160125,20160201,20160208,20160215,20160222,20160229,20160307,20160314,20160321,20160328,20160404,20160411,20160418,20160425,20160502,20160509,20160516,20160523,20160530]

for date in datesT:
    print(date)
    payload = {'q': 'Ted Cruz', 'fq': 'headline:Cruz','fl': "pub_date,headline,web_url", 'end_date': date, 'sort': "newest" }
    headers = { 'apikey': 'ee15d3b7ab684613b16e22d82e8e1cc2'}
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    r = requests.get(url, headers = headers, params = payload)
    jsonData = r.json()
    wurl = jsonData['response']['docs'][0]['web_url']
    headline = jsonData['response']['docs'][0]['headline']['main']
    d = {"date": date, "web_url": wurl, "headline":headline}
    list1.append(d)
print(r.status_code)
print(r.text)



with open('nytimes_cruz.json', 'w') as outfile:
    json.dump(list1, outfile)

