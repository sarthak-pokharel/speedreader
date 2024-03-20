import { Route, Routes } from "react-router-dom"
import Book from "./Book"
import FileUpload from "./FileUpload"

function App() {
  return (<>
  
  <Routes>

    <Route path="/" element={<FileUpload />} />
    <Route path={"/Book/:bookid"} Component={Book} />
  </Routes>
  
  </>)
}

export default App
