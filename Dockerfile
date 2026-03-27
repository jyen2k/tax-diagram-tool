FROM python:3.12-slim

WORKDIR /app

COPY index.html styles.css app.js README.md .appgarden.json ./

EXPOSE 8080

CMD ["sh", "-c", "python -m http.server ${PORT:-8080} --bind 0.0.0.0 --directory /app"]
