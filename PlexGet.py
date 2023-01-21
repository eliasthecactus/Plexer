#!/usr/bin/env python
# -*- coding: utf-

#import libraries
import argparse
from common import *

#get arguments
parser = argparse.ArgumentParser()
parser.add_argument("--mode", help="port for the operating mode (gui/cli)", type=str, choices=["gui", "cli"], default="gui")
parser.add_argument("--port", help="port on which the webinterface should run", type=int, default=80)
parser.add_argument("--config", type=pathlib.Path, default=pathlib.Path(__file__).absolute().parent, help="Path where the config should be stored")
parser.add_argument("--library", type=pathlib.Path, default=pathlib.Path(__file__).absolute().parent, help="Path where the library infos should be stored")
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
    
    #check if config path is valid
    if not args.config.is_dir():
        parser.error("--config not valid. choose a valid path.")

    #check if library path is valid
    if not args.library.is_dir():
        parser.error("--library not valid. choose a valid path.")



    
    



def main():
    check_args()
    #run cli mode
    if args.mode == "cli":
        #config(args.config)
        pass
    #run gui mode
    elif args.mode == "gui":
        pass
    else:
        exit()



    


#start main function
if __name__ == "__main__":
    main()