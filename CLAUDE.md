# Stock Trading Life Simulation - Developer Guide

## Python Environment

The Python virtual environment for this project is located at:
`/Users/xiangfang/Developer/soft/venv_3.11.9`

To run Python/pip commands:
- Always use the absolute Python path: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/python`
- Always use the absolute pip path: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/pip`
- To run backend tests: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/pytest` in the `backend` directory.

## Build and Run Commands

### Frontend (React + Vite)
- Start development server: `npm run dev` (inside `frontend` directory)
- Production build: `npm run build` (inside `frontend` directory)
- Lint: `npm run lint` (inside `frontend` directory)

### Backend (FastAPI)
- Start backend server: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/python -m uvicorn main:app --reload` (inside `backend` directory)
- Run tests: `/Users/xiangfang/Developer/soft/venv_3.11.9/bin/pytest` (inside `backend` directory)
