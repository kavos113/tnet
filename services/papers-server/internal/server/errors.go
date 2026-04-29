package server

type unimplementedError struct {
	name string
}

func errUnimplemented(name string) error {
	return &unimplementedError{name: name}
}

func (err *unimplementedError) Error() string {
	return err.name + " is not implemented"
}
