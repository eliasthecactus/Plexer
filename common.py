import pathlib
import requests
import random
import string
from xml.etree import ElementTree
import logging
import json
import re
import urllib.parse
import codecs
import base64
import argparse
import configparser
import os
import shutil
import time
import platform


config = configparser.ConfigParser(strict=False)

logging.basicConfig(filename="PlexGet.log", format='%(asctime)s %(levelname)-8s %(message)s', datefmt='%Y-%m-%d %H:%M:%S', encoding="utf-8", level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler())


def clear():
    if platform.system() == "Windows":
        os.system('cls')
    else:
        os.system('clear')

def random_generator(size=20, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


    
#function to get plex-token of your account
def get_servers(user, password, path):
    #try:
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

        with open(path / "servers.json", "w") as servers_file:
            json.dump(servers, servers_file)
        return servers
    #except:
    #    logging.error("Error with getting server. Please ceck your credentials and try again")
    #    return False
        

def getLibrarys(server, token, path):
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
            temp_dict["type"] = y.attrib["type"]
            libraries.append(temp_dict)

        with open(path / "libraries.json", "w") as libraries_file:
            json.dump(libraries, libraries_file)
        return True

    except:
        logging.error("Error with getting libraries. Make sure you have some libraries which you can access")
        return False

def mediaList(server, id, token, path):
    try:
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

            
            key = re.match("(.*\/)(.*?)$", x[0][0].attrib["key"]).group(1)
            file = re.match("(.*\/)(.*?)$", x[0][0].attrib["file"]).group(2)
            movie_identifier = key+file
            downloadurl = server+urllib.parse.quote(movie_identifier)+"?download=0&X-Plex-Token="+token


            temp_dict = {}
            try:
                temp_dict["title"] = x.attrib['title']
            except:
                temp_dict["title"] = ""
            try:
                temp_dict["year"] = x.attrib['year']
            except:
                temp_dict["year"] = ""
            try:
                temp_dict["rating"] = x.attrib['audienceRating']
            except:
                temp_dict["rating"] = ""
            try:
                temp_dict["summary"] = x.attrib['summary']
            except:
                temp_dict["summary"] = ""
            try:
                temp_dict["download_url"] = downloadurl
            except:
                temp_dict["download_url"] = ""
            try:
                temp_dict["art_url"] = server+x.attrib["art"]+"?X-Plex-Token="+token
            except:
                temp_dict["art_url"] = ""
            try:
                temp_dict["thumb_url"] = server+x.attrib["thumb"]+"?X-Plex-Token="+token
            except:
                temp_dict["thumb_url"] = ""
            try:
                temp_dict["duration"] = round((int(x.attrib["duration"])/1000)/60)
            except:
                temp_dict["duration"] = ""
            try:
                temp_list2 = []
                for z in x.iter("Genre"):
                    temp_list2.append(z.attrib["tag"])
                temp_dict["genres"] = temp_list2
            except:
                temp_dict["genres"] = ""

            media.append(temp_dict)

        with codecs.open(path / "media.json", "w", encoding="UTF-8") as media_file:
            json.dump(media, media_file, ensure_ascii=False)
        return True

    except:
        logging.error("Error with getting media. Please make sure that your selected library contains some media files")
        return False
    

def encode64(string):
    return base64.b64encode(string.encode('utf-8')).decode("utf-8")

def decode64(string):
    return base64.b64decode(string).decode('utf-8')


def getUser(path):
    try:
        config.read(pathlib.Path(path / pathlib.Path("config.ini")))
        return decode64(config['CREDENTIALS']['username'])
    except:
        False

def getPass(path):
    try:
        config.read(pathlib.Path(path / pathlib.Path("config.ini")))
        return decode64(config['CREDENTIALS']['password'])
    except:
        False

def getToken(path):
    try:
        config.read(pathlib.Path(path / pathlib.Path("config.ini")))
        return decode64(config['SERVER']['token'])
    except:
        return False

def getURL(path):
    try:
        config.read(pathlib.Path(path / pathlib.Path("config.ini")))
        return decode64(config['SERVER']['url'])
    except:
        return False

def saveServer(url, token, name, path):
    #config['SERVER'] = {'URL': url, 'token': token}
    config.read(pathlib.Path(path / pathlib.Path("config.ini")))
    try:
        config.add_section('SERVER')
    except:
        pass
    config.set('SERVER', 'url' , url)
    config.set('SERVER', 'name' , name)
    config.set('SERVER', 'token' , token)
    with open(pathlib.Path(path / pathlib.Path("config.ini")), 'w') as f:
        config.write(f)

def saveCred(user, password, path):
    #config['CREDENTIALS'] = {'username': encode64(user), 'password': encode64(password)}
    config.read(pathlib.Path(path / pathlib.Path("config.ini")))
    try:
        config.add_section('CREDENTIALS')
    except:
        pass
    config.set('CREDENTIALS', 'username' ,encode64(user))
    config.set('CREDENTIALS', 'password' ,encode64(password))
    with open(pathlib.Path(path / pathlib.Path("config.ini")), 'w') as f:
        config.write(f)

def saveLibrary(name, id, path):
    config.read(pathlib.Path(path / pathlib.Path("config.ini")))
    try:
        config.add_section('LIBRARY')
    except:
        pass
    config.set('LIBRARY', 'name' , name)
    config.set('LIBRARY', 'id' , id)
    with open(pathlib.Path(path / pathlib.Path("config.ini")), 'w') as f:
        config.write(f)

#check if creds are valid
def checkCred(user, password):
    url = "https://plex.tv/users/sign_in.json"
    payload = "user%5Bpassword%5D="+password+"&user%5Blogin%5D="+user
    headers = {
        'X-Plex-Version': '4.99.2',
        'X-Plex-Product': 'Plex Web',
        'X-Plex-Client-Identifier': random_generator(26),
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    if str(response.status_code).startswith('2'):
        return True
    else:
        #logging.error((response.content).decode('utf-8'))
        return False

def jsonToDict(file):
    with open(file) as json_file:
        return json.load(json_file)

def checkFileExists(file):
    if file.is_file():
        return True
    else:
        return False