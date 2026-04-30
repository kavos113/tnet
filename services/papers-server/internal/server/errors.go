package server

import "connectrpc.com/connect"

type errorVisibility string

const (
	errorVisibilityUser  errorVisibility = "user"
	errorVisibilityDebug errorVisibility = "debug"
)

type handlerError struct {
	code       connect.Code
	message    string
	visibility errorVisibility
	cause      error
}

func invalidArgumentError(err error) error {
	return toConnectError(handlerError{
		code:       connect.CodeInvalidArgument,
		message:    err.Error(),
		visibility: errorVisibilityUser,
		cause:      err,
	})
}

func internalError(err error) error {
	return toConnectError(handlerError{
		code:       connect.CodeInternal,
		message:    "internal server error",
		visibility: errorVisibilityDebug,
		cause:      err,
	})
}

func toConnectError(err handlerError) error {
	return connect.NewError(err.code, err)
}

func (err handlerError) Error() string {
	return err.message
}

func (err handlerError) Unwrap() error {
	return err.cause
}

type unimplementedError struct {
	name string
}

func errUnimplemented(name string) error {
	return &unimplementedError{name: name}
}

func (err *unimplementedError) Error() string {
	return err.name + " is not implemented"
}
