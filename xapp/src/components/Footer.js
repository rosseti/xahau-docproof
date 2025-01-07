import Image from "next/image";

const Footer = () => {
    return (
        <footer className="container mx-auto py-10 px-4 w-1/2">

            <div className="items-center text-center">
                <p className="text-sm">&copy; 2024 {process.env.NEXT_PUBLIC_APP_NAME || 'Xahau | DocProof'}. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
