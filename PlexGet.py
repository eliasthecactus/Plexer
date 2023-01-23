#!/usr/bin/env python

from common import *
config = configparser.ConfigParser(strict=False)
#get arguments
parser = argparse.ArgumentParser()
parser.add_argument("--mode", help="port for the operating mode (gui/cli)", type=str, choices=["gui", "cli"], default="gui")
parser.add_argument("--port", help="port on which the webinterface should run", type=int, default=80)
parser.add_argument("--config", type=pathlib.Path, default=pathlib.Path(__file__).absolute().parent / pathlib.Path("data") / pathlib.Path("config"), help="Path where the config should be stored")
parser.add_argument("--library", type=pathlib.Path, default=pathlib.Path(__file__).absolute().parent / pathlib.Path("data") / pathlib.Path("library"), help="Path where the library infos should be stored")
args = parser.parse_args()

#function to check if arguments are correct
def check_args():
    #check if mode arg is specified correctly
    if args.mode == "gui" or args.mode == "cli":
        pass
    else:
        parser.error("--mode should be either 'gui' or 'cli'.")

    #check if port is valid
    if type(args.port) != int or not args.port < 99999:
        parser.error("--port not valid. choose port between 1 and 99999.")
    
    #create path structure if it doesn't exist
    args.config.mkdir(parents=True, exist_ok=True)
    args.library.mkdir(parents=True, exist_ok=True)



def configure():
    if checkFileExists(args.config / pathlib.Path("config.ini")):
        os.remove(args.config / pathlib.Path("config.ini"))
        clear()
        print("Deleted config. Please restart script")
        exit()
    """
    try:
        os.remove(args.config / pathlib.Path("config.ini"))
    except:
        pass
    """
    try:
        os.remove(args.library / pathlib.Path("media.json"))
    except:
        pass
    try:
        os.remove(args.library / pathlib.Path("libraries.json"))
    except:
        pass
    try:
        os.remove(args.library / pathlib.Path("servers.json"))
    except:
        pass
    donotexit = 1

    while donotexit == 1:
        try:
            config.read(args.config / pathlib.Path("config.ini"))
            try:
                config.read(args.config / pathlib.Path("config.ini"))
                config["CREDENTIALS"]["username"]
                try:
                    config.read(args.config / pathlib.Path("config.ini"))
                    config["SERVER"]["url"]
                    try:
                        config["LIBRARY"]["id"]
                        try:
                            mediaList(config["SERVER"]["url"], config["LIBRARY"]["id"], config["SERVER"]["token"], args.library)
                            donotexit = 0
                        except:
                            logging.error("Error with getting media")
                    except:     
                        getLibrarys(config["SERVER"]["url"], config["SERVER"]["token"], args.library)
                        data = list(jsonToDict(args.library / pathlib.Path("libraries.json")))
                        printMenu("","")
                        for i, x in enumerate(data):
                            print(str(i)+": "+str(x['title']))
                        choice1 = int(input("Please choose a library: "))
                        saveLibrary(str(data[int(choice1)]['title']), str(data[int(choice1)]['id']), args.config)
                except:
                    get_servers(getUser(args.config), getPass(args.config), args.library)
                    data = list(jsonToDict(args.library / pathlib.Path("servers.json")))
                    printMenu("","")
                    for i, x in enumerate(data):
                        print(str(i)+": "+str(x['name']))
                    choice1 = int(input("Please choose a Server: "))
                    server_name = data[choice1]['name']
                    server_token = data[choice1]['token']
                    printMenu("","")
                    for i, x in enumerate(data[choice1]['connections']):
                        print(str(i)+": "+str(x['protocol'])+"://"+str(x['address'])+":"+str(x['port']))
                    choice2 = int(input("Please choose a connection: "))
                    server_url = data[choice1]['connections'][choice2]['protocol']+"://"+data[choice1]['connections'][choice2]['address']+":"+data[choice1]['connections'][choice2]['port']
                    saveServer(server_url, server_token, server_name, args.config)
            except:
                printMenu("","")
                saveCred(str(input("Plex Username/Mail: ")),str(input("Plex Password: ")),args.config)
                time.sleep(1)
        except:
            printMenu("","")
            saveCred(str(input("Plex Username/Mail: ")),str(input("Plex Password: ")),args.config)
    printMenu("Configuration finished","You can now use your saved configuration. Press ENTER to continue.")
    input("")
    main()

def printMenu(title, choices):
    clear()
    print("""
██████╗ ██╗     ███████╗██╗  ██╗ ██████╗ ███████╗████████╗
██╔══██╗██║     ██╔════╝╚██╗██╔╝██╔════╝ ██╔════╝╚══██╔══╝
██████╔╝██║     █████╗   ╚███╔╝ ██║  ███╗█████╗     ██║   
██╔═══╝ ██║     ██╔══╝   ██╔██╗ ██║   ██║██╔══╝     ██║   
██║     ███████╗███████╗██╔╝ ██╗╚██████╔╝███████╗   ██║   
╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   
    by eliasthecactus
    """)
    print()
    print("config: "+str(args.config))
    print("library: "+str(args.library))
    print("mode: "+str(args.mode))
    print("\n==============="+title+"===============")
    print(choices)
    print("")


def main():
    check_args()

    #run cli mode
    if args.mode == "cli":
        if getUser(args.config) and getPass(args.config):
            if checkCred(getUser(args.config), getPass(args.config)):
                if checkFileExists(args.library / pathlib.Path("media.json")):
                    printMenu("Use existing Configuration?","" )
                    choice3 = str(input("y/n: "))
                    if choice3.lower() == "y":
                        pass
                    elif choice3.lower() == "n":
                        configure()
                    else:
                        print("Wrong choice")
                        exit()
                else:
                    configure()
            else:
                logging.error("Wrong Credentials. Please retry")
                configure()
        else:
            configure()
            

    #run gui mode
    elif args.mode == "gui":
        pass
    else:
        exit()



    


#start main function
if __name__ == "__main__":
    main()