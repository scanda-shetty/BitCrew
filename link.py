# server.py
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/update-ipfs', methods=['POST'])
def update_ipfs():
    data = request.json
    ipfs_hash = data.get('ipfsHash')
    account_address = data.get('account')  
    if ipfs_hash:
        print(f"Received IPFS hash: {ipfs_hash}")  # Debug statement
        # Send the IPFS hash to the predict.py service
        predict_url = 'http://127.0.0.1:5001/predict'  # Update with your predict.py URL
        response = requests.post(predict_url, json={'ipfsHash': ipfs_hash, 'account': account_address})
        
        if response.status_code == 200:
            print("Prediction request successful:", response.json())
            return jsonify({"status": "success", "message": "IPFS hash sent to prediction service."}), 200
        else:
            print("Failed to send IPFS hash to prediction service:", response.json())
            return jsonify({"status": "error", "message": "Failed to send IPFS hash."}), 500
    else:
        return jsonify({"status": "error", "message": "IPFS hash not provided."}), 400
if __name__ == '__main__':
    app.run(debug=True, port=5000)
