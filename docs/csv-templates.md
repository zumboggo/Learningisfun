# CSV Template Examples

Learning is Fun supports importing flashcard decks from CSV files. The CSV parser handles UTF-8 encoding and supports Unicode characters (Chinese, accented characters, etc.).

## Supported Column Headers

The parser automatically detects these column names (case-insensitive):

| Front Column | Back Column |
|--------------|-------------|
| front | back |
| term | definition |
| question | answer |
| word | meaning |
| english | translation |
| hanzi | pinyin |
| kanji | reading |

If headers are not recognized, the first two columns are used as front/back by default. Manual column mapping is available in the import UI.

## Template: Basic Vocabulary

```csv
front,back
hello,你好
goodbye,再见
thank you,谢谢
please,请
sorry,对不起
```

## Template: With Accented Characters

```csv
front,back
café,coffee shop
naïve,innocent
résumé,curriculum vitae
über,over
señor,mister
```

## Template: Chinese-English

```csv
term,definition
你好,Hello (nǐ hǎo)
谢谢,Thank you (xièxiè)
再见,Goodbye (zàijiàn)
对不起,Sorry (duìbuqǐ)
请,Please (qǐng)
```

## Template: Question-Answer

```csv
question,answer
What is the capital of France?,Paris
What is H2O?,Water
What year did World War II end?,1945
```

## Template: Definition Format

```csv
word,meaning
photosynthesis,The process by which plants convert sunlight into energy
mitosis,Cell division producing two identical daughter cells
osmosis,The movement of water through a semipermeable membrane
```

## Template: Large Deck

```csv
front,back
abandon,to leave completely and finally
ability,power or capacity to do something
absence,the state of being away
abstract,existing in thought or as an idea
abundant,existing in large quantities
academic,relating to education
accept,willing to receive something
access,means of approaching
accomplish,achieve or complete
according to,as stated or reported by
```

## CSV Format Rules

### Encoding
- **UTF-8** required for Unicode characters
- BOM (Byte Order Mark) is handled automatically

### Delimiter
- Comma (`,`) is the default delimiter
- Fields containing commas must be quoted: `"hello, world"`

### Quoting
- Fields with commas, quotes, or newlines must be quoted
- Quotes within quoted fields are escaped with double quotes: `"say ""hello"""`

### Line Endings
- Both `\n` (Unix) and `\r\n` (Windows) are supported

### Empty Rows
- Empty rows are skipped automatically
- Rows with only one field filled are flagged as invalid

### Duplicates
- Duplicate cards (same front and back) are detected and counted
- Duplicates are excluded from import

### Field Length
- Fields longer than 5,000 characters are flagged as warnings
- Very long fields may cause display issues on mobile

## Import Preview

Before importing, the app shows:
- Total cards detected
- Invalid rows (missing front or back)
- Empty rows skipped
- Duplicate cards removed
- Long field warnings
- Preview of first 10 cards
- Column mapping selection

## Exporting from Other Apps

### Anki
1. In Anki, go to File → Export
2. Select "Notes in Plain Text"
3. Include fields: Front, Back
4. Save as .csv

### Quizlet
1. In Quizlet, go to your set
2. Click the three dots → Export
3. Choose "Tab" or "Comma" delimiter
4. Copy and save as .csv

### Google Sheets
1. Select your data
2. File → Download → Comma-separated values (.csv)
3. Ensure column headers are in the first row

### Microsoft Excel
1. Save As → CSV UTF-8 (Comma delimited)
2. Ensure column headers are in the first row
