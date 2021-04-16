#!/usr/bin/env python
# importing the module
from imdbpy import IMDb
   
# creating instance of IMDb
ia = IMDb()
   
# name 
name = "Udta punjab"
   
# searching the name 
search = ia.search_movie(name)
if len(search)>0:
    id = search[0].movieID
    print(id)