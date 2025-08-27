import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@hexlet/testing-task-manager'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

ReactDOM.createRoot(root).render(App())


