all: $(patsubst %.po,%.mo,$(wildcard */LC_MESSAGES/*.po))

%.mo: %.po
	msgfmt $< -o $@

clean:
	find . -name \*.mo -exec rm {} \;
