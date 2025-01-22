After cloning the repository, follow the following steps.

## (Optional but advised) Set up virtual environment
Move to project directory
`cd path/to/your/project`
Create virtual environment
`python -m venv venv`
Activate it
In windows(git bash):
`source venv/Scripts/activate`

## Install requirements.txt after installing virtual environment
`pip install -r requirements.txt`
Verify front end using
`pip list`

## Running frontend
`cd frontend`
`npm start`

## Running backend
`cd backend`
`cd app`
`uvicorn main1:app --reload`
