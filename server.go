package main

import (
	"embed"
	"encoding/json"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"
)

//go:embed *.html css images js lighthouse api/products.json
var site embed.FS

type product struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Price       int    `json:"price"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Alt         string `json:"alt"`
	Badge       string `json:"badge"`
	Href        string `json:"href"`
}

func main() {
	address := flag.String("addr", "127.0.0.1:8080", "HTTP listen address")
	flag.Parse()

	data, err := site.ReadFile("api/products.json")
	if err != nil {
		log.Fatal(err)
	}
	var products []product
	if err := json.Unmarshal(data, &products); err != nil {
		log.Fatalf("read catalog: %v", err)
	}

	server := &http.Server{
		Addr:              *address,
		Handler:           shopHandler(products),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	log.Printf("RoastLab: http://%s", *address)
	log.Fatal(server.ListenAndServe())
}

func shopHandler(products []product) http.Handler {
	mux := http.NewServeMux()
	list := func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, products)
	}
	mux.HandleFunc("GET /api/products", list)
	mux.HandleFunc("GET /api/products.json", list)
	mux.HandleFunc("GET /api/products/{id}", func(w http.ResponseWriter, r *http.Request) {
		for _, item := range products {
			if item.ID == r.PathValue("id") {
				writeJSON(w, http.StatusOK, item)
				return
			}
		}
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "product not found"})
	})

	files := http.FileServerFS(site)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			info, err := fs.Stat(site, strings.TrimPrefix(r.URL.Path, "/"))
			if err != nil || info.IsDir() {
				http.NotFound(w, r)
				return
			}
		}
		files.ServeHTTP(w, r)
	})
	return mux
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("write API response: %v", err)
	}
}
