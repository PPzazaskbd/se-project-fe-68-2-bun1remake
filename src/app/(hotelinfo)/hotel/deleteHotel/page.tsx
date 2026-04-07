"use client"
import { useState, useEffect } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DeleteHotelPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const hotelName = searchParams.get("name") || "this hotel";
    const hotelId = searchParams.get("id");

    const [confirmName, setConfirmName] = useState("");
    const isMatch = confirmName === hotelName;

    useEffect(() => {
        if (status !== "loading") {
            if (!session || session.user.role !== "admin") {
                router.push("/"); 
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FDF6EF]">
                <p className="text-xl font-bold text-[#B23B47]">Loading...</p>
            </div>
        );
    }

    if (status === "unauthenticated" || session?.user?.role !== "admin") {
        return <div className="min-h-screen bg-[#FDF6EF]" />; 
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-start bg-[#FDF6EF] px-4 font-figma-copy pt-8">
            
            <h1 className="mb-8 text-4xl tracking-widest text-black sm:text-5xl font-bold">
                ARE YOU SURE?
            </h1>

            {/* กล่องข้อความ */}
            <div className="w-full max-w-[500px] bg-[#F5E6E0] p-8 sm:p-10 shadow-sm">
                
                {/* ข้อความอธิบาย - ใช้ตัวแปร hotelName ที่ดึงมา */}
                <p className="text-[1.15rem] leading-relaxed text-black font-bold">
                    You are about DELETE <span className="text-[#B23B47]">{hotelName}</span> hotel. 
                    This will permanently delete this hotel and related information like Hotel picture, 
                    Address and Tags.
                </p>

                {/* ข้อความให้ยืนยัน */}
                <p className="mt-6 text-[1.15rem] text-black font-bold">
                    To confirm, type "{hotelName}"
                </p>

                {/* ช่อง Input */}
                <input
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="mt-4 w-full border-b-2 border-[#B23B47] bg-transparent pb-1 text-[1.15rem] outline-none focus:border-red-700"
                    placeholder="Type hotel name here"
                />

                {/* ปุ่มกดยกเลิก / ยืนยัน */}
                <div className="mt-10 flex w-full font-bold">
                    {/* ปุ่ม CANCEL */}
                    <button 
                        className="w-1/2 bg-[#B23B47] py-3 text-[1.15rem] tracking-wider text-white transition-colors hover:bg-red-800 cursor-pointer"
                        onClick={() => router.back()}
                    >
                        CANCEL
                    </button>
                    
                    {/* ปุ่ม DELETE */}
                    <button 
                        disabled={!isMatch}
                        className={`w-1/2 py-3 text-[1.15rem] tracking-wider border border-[#B23B47] transition-all
                            ${isMatch 
                                ? "bg-[#FDF6EF] text-[#B23B47] hover:bg-[#f0e4d8] cursor-pointer opacity-100" 
                                : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
                            }`}
                        onClick={() => {
                            if (isMatch) {
                                console.log("Deleting hotel ID:", hotelId);
                                // logic ลบจริง
                            }
                        }}
                    >
                        DELETE
                    </button>
                </div>
                
            </div>
        </div>
    );
}