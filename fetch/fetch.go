package main

import (
	"github.com/kr/pretty"
	"github.com/odwrtw/kickass"
)

func main() {
	// New kickass client
	k := kickass.New()

	// Search query
	query := &kickass.Query{
		User:     "YIFY",
		OrderBy:  "seeders",
		Order:    "desc",
		Category: "movies",
	}

	// Search
	torrents, err := k.Search(query)
	if err != nil {
		pretty.Println(err)
		return
	}

	pretty.Println(torrents)
}
