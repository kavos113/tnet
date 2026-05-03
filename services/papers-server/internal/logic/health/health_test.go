package health

import "testing"

func TestServiceStatus(t *testing.T) {
	testcases := []struct {
		name        string
		version     string
		wantStatus  string
		wantVersion string
	}{
		{
			name:        "returns ok with configured version",
			version:     "1.2.3",
			wantStatus:  "ok",
			wantVersion: "1.2.3",
		},
		{
			name:        "allows empty version",
			version:     "",
			wantStatus:  "ok",
			wantVersion: "",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			service := NewService(testcase.version)

			status, version := service.Status()
			if status != testcase.wantStatus || version != testcase.wantVersion {
				t.Fatalf("Status() = (%q, %q), want (%q, %q)", status, version, testcase.wantStatus, testcase.wantVersion)
			}
		})
	}
}
