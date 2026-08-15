FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY microservice.py main.py api.py ./

EXPOSE 8000
ENTRYPOINT ["python", "api.py"]