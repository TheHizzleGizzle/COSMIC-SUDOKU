# Test credentials

Cosmic Sudoku has no accounts or login. It is fully offline; progress lives on the device
(AsyncStorage on native, localStorage key `cosmic-sudoku:v2` in the web preview).

To simulate a damaged save in the web preview: set localStorage `cosmic-sudoku:v2` to `{broken` and reload.
