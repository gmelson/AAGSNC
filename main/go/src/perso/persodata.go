package perso


// Json userAuthParams
type Challenge struct {
	Question string `json:"question"`
	Answer string `json:"answer"`
}

// Json additionalParams
type Perso struct {
	Name string `json:"name"`
	Value string `json:"value"`
}

// Json tag
type TagData struct {
	Value string `json:"value"`
	Tag string `json:"tag"`
	BelongsTo string `json:"belongsTo"`
}

// Json dgi
type DgiData struct {
	Value string `json:"value"`
	MinLength int `json:"minLength"`
	MaxLength int `json:"maxLength"`
	Tags [] TagData `json:"tags"`
}

// Json docs
type Document struct {
	CardNumber string `json:"cardNumber,omitempty"`
	Variant int `json:"variant,omitempty"`
	Status int `json:"status,omitempty"`
	ApplicationId int `json:"applicationId,omitempty"`
	Nickname string `json:"nickname,omitempty"`
	DownloadExpDate string `json:"downloadexpdate,omitempty"`
	Description string `json:"description,omitempty"`
	UserAuthParams [] Challenge `json:"userAuthParams,omitempty"`
	AdditionalParams [] Perso `json:"additionalParams"`
	Dgi [] DgiData `json:"dgi,omitempty"`
}

// Wrapper structure for docs
type CardInfo struct {
	Docs [] Document `json:"docs"`
}

