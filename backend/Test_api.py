from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Meteor Madness API is live 🚀"}
