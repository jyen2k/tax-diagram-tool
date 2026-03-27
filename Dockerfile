FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY index.html feedback.html styles.css app.js feedback.js README.md .appgarden.json server.py ./

EXPOSE 8080

CMD ["sh", "-c", "python server.py"]
