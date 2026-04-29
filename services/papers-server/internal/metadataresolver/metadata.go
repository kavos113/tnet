package metadataresolver

import (
	"context"
	"errors"
)

type Source struct {
	SourceURL string
	DOI       string
	ArxivID   string
}

type Metadata struct {
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	URL           string
	PDFURL        string
}

type Resolver interface {
	Resolve(context.Context, Source) (Metadata, error)
}

type CompositeResolver struct {
	resolvers []Resolver
}

func NewCompositeResolver(resolvers ...Resolver) *CompositeResolver {
	return &CompositeResolver{resolvers: resolvers}
}

func NewDefaultResolver() *CompositeResolver {
	return NewCompositeResolver(NewACMResolver(nil), NewCrossrefResolver(nil))
}

func (resolver *CompositeResolver) Resolve(ctx context.Context, source Source) (Metadata, error) {
	for _, candidate := range resolver.resolvers {
		metadata, err := candidate.Resolve(ctx, source)
		if err == nil && !metadata.IsZero() {
			return metadata, nil
		}
	}
	return Metadata{}, nil
}

func (metadata Metadata) IsZero() bool {
	return metadata.Title == "" &&
		len(metadata.Authors) == 0 &&
		metadata.Abstract == "" &&
		metadata.PublishedYear == 0 &&
		metadata.Venue == "" &&
		metadata.DOI == "" &&
		metadata.URL == "" &&
		metadata.PDFURL == ""
}

var ErrUnsupported = errors.New("metadata source is not supported")
