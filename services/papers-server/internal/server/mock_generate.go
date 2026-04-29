package server

//go:generate go run go.uber.org/mock/mockgen@v0.6.0 --source=health_handler.go --destination=mock/mock_health_checker.go --package=mock_server
