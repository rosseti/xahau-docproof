import Link from 'next/link'
 
export default function NotFound() {
  return (
    <>
      <div className="container mx-auto pt-10 px-4 w-full lg:w-1/2">
        
        <h1 className="text-4xl font-bold pb-4">
        Not Found
        </h1>

        <p className="mb-4">Could not find requested resource</p>
        <Link className="link" href="/">Return Home</Link>
      </div>
    </>
  )
}