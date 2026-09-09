// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	payload, err := os.ReadFile("../fixtures/post-call.json")
	if err != nil {
		panic(err)
	}
	response, err := http.Post("http://localhost:8788/webhooks/omnidimension", "application/json", bytes.NewReader(payload))
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%d %s\n", response.StatusCode, body)
}
