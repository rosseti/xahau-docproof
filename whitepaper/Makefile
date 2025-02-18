PDF_ENGINE = xelatex
FILTERS = --lua-filter=.pandoc/mermaid.lua
BIBLIOGRAPHY = --bibliography=references.bib
INPUT = XahauDocproof-Whitepaper.md
OUTPUT = XahauDocproof-Whitepaper.pdf

PANDOC_FLAGS = -f markdown -t pdf $(BIBLIOGRAPHY) --pdf-engine=$(PDF_ENGINE) $(FILTERS)

all: $(OUTPUT)

$(OUTPUT): $(INPUT) references.bib .pandoc/mermaid.lua
	pandoc $(PANDOC_FLAGS) $(INPUT) -o $(OUTPUT)

install:
	cp $(OUTPUT) ../xapp/public/.

clean:
	rm -f $(OUTPUT)
