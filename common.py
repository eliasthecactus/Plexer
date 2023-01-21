import pathlib
import requests
import random
import string
from xml.etree import ElementTree
import logging
import json

logging.basicConfig(filename="PlexGet.log", format='%(asctime)s %(levelname)-8s %(message)s', datefmt='%Y-%m-%d %H:%M:%S', encoding="utf-8", level=logging.INFO)



def random_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

    
#function to get plex-token of your account
def get_servers(user, password):
    try:
        url = "https://plex.tv/users/sign_in.json"
        payload = "user%5Bpassword%5D="+password+"&user%5Blogin%5D="+user
        headers = {
            'X-Plex-Version': '4.99.2',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Client-Identifier': random_generator(26),
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.request("POST", url, headers=headers, data=payload).json()



        temp_token = response["user"]["authToken"]

        url = "https://plex.tv/api/v2/resources"
        payload = "user%5Bpassword%5D="+password+"&user%5Blogin%5D="+user
        headers = {
            'X-Plex-Version': '4.99.2',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Client-Identifier': random_generator(26),
            'X-Plex-Token': temp_token,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.request("GET", url, headers=headers, data=payload)
        xml_response = ElementTree.fromstring(response.content)
        servers = []
        temp_dict2 = {}
        temp_list = []
        ######make a list or dict with every resource and return it
        for y in xml_response.iter("resource"):
            temp_dict = {}
            temp_dict["name"] = y.attrib["name"]
            temp_dict["token"] = y.attrib["accessToken"]
            #for every connection per server
            for x in y[0].iter("connection"):
                temp_dict2 = {}
                temp_dict2["protocol"] = x.attrib["protocol"]
                temp_dict2["address"] = x.attrib["address"]
                temp_dict2["port"] = x.attrib["port"]

                temp_list.append(temp_dict2)
        #add the connection list to the connection key 
        temp_dict["connections"] = temp_list
        #add the resource to the json
        servers.append(temp_dict)

        with open("servers.json", "w") as servers_file:
            json.dump(servers, servers_file)
        return True
    except:
        logging.error("Error with getting server")
        return False
        

def getLibrarys(server, token):
    try:
        url = server+"/library/sections"
        headers = {
            'X-Plex-Version': '4.99.2',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Client-Identifier': random_generator(26),
            'X-Plex-Token': token,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.request("GET", url, headers=headers)
        xml_response = ElementTree.fromstring(response.content)
        
        libraries = []
        for y in xml_response.iter("Directory"):
            temp_dict = {}
            temp_dict["title"] = y.attrib["title"]
            temp_dict["id"] = y.attrib["key"]
            temp_dict["language"] = y.attrib["language"]
            libraries.append(temp_dict)

        with open("libraries.json", "w") as libraries_file:
            json.dump(libraries, libraries_file)
        return True

    except:
        logging.error("cannot get librarys")
        return False

def mediaList(server, id, token):
    #try:
        url = server+"/library/sections/"+ id +"/all"
        headers = {
            'X-Plex-Version': '4.99.2',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Client-Identifier': random_generator(26),
            'X-Plex-Token': token,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.request("GET", url, headers=headers)
        xml_response = ElementTree.fromstring(response.content)
        
        media = []
        for x in xml_response.iter("Video"):
            key = x[0][0].attrib["key"]
            file = x[0][0].attrib["file"]
            print(key)


            temp_dict = {}
            temp_dict["title"] = x.attrib["title"]
            try:
                temp_dict["art_url"] = x.attrib["art"]
            except:
                temp_dict["art_url"] = ""
            try:
                temp_dict["thumb_url"] = x.attrib["thumb"]
            except:
                temp_dict["thumb_url"] = ""
            media.append(temp_dict)

        #with open("media.json", "w") as media_file:
        #    json.dump(media, media_file)
        return True

    #except:
    #    logging.error("cannot get librarys")
    #    return False
    
    





#function to create the config file
def config(config_path):
    #config file path
    config_file = config_path / pathlib.Path("config")
    #create config file if it doesn't exist
    if not config_file.is_file():
        with open(config_file, 'w') as fp:
            fp.write('')

