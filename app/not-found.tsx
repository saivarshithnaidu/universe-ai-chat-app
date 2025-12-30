import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <h2 className="text-4xl font-bold mb-4">Not Found</h2>
            <p className="text-gray-400 mb-8">Could not find requested resource</p>
            <Link
                href="/"
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
                Return Home
            </Link>
        </div>
    )
}
