package health

type Service struct {
	version string
}

func NewService(version string) *Service {
	return &Service{version: version}
}

func (s *Service) Status() (string, string) {
	return "ok", s.version
}
