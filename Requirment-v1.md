# Context:
The tool must handle multiple image scenarios:
- A single delivery ticket document on its own
- A single Bol (Bill of Lading) document on its own
- Both a delivery ticket and Bol side by side in the same image (handwritten delivery ticket on left side, Bol on right side)

The OCR system should intelligently detect and extract information from each document type, whether presented individually or together within a single image.

1. Must design and build an opensource LLM OCR tool.
2. That can help get the following information from them in a format for excel sheet: Date, Manifest no, Bol, Delivery point, Regular, super, diesel
3. I can give a list of all delivery points. Around 200-300 sites. But later.
4. If we could build an AI app to auto detect the info from delivery ticket and the gallons, if possible, Bol just by scanning could be amazing
5. AI app should help us detect if it’s not able to understand it move to Human review. To do so let’s rely on some scoring (in percentage) mechanism where score is something how confident the LLM is about the correct text LLM captures during the conversion from image to text.
6. Lets start with something opensource then we can look for some paid options if we need to. I am open to suggestions on that.
7. The tool should be user-friendly and easy to use for non-technical users.
8. The tool should be able to handle a large volume of delivery tickets and Bol documents efficiently.
9. The tool should have a feature to export the extracted information in a format compatible with Excel sheets.
10. The tool should have a feature to allow users to manually review and correct any information that the AI app is not confident about.
11. The tool should be able to learn and improve over time based on user feedback and corrections.
12. The tool should have a secure and reliable data storage mechanism to store the extracted information and user feedback.

