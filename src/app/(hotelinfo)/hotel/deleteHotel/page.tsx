"use client"
import { useRouter } from "next/navigation";

interface DeleteConfirmProps {
  hotelName?: string;
}

export default function DeleteConfirm({ 
  hotelName = "The Peninsula" 
}: DeleteConfirmProps) {
    const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#FDF6EF] px-4 font-figma-copy pt-8">
      
      <h1 className="mb-8 text-4xl tracking-widest text-black sm:text-5xl font-bold">
        ARE YOU SURE?
      </h1>

      {/* กล่องข้อความ */}
      <div className="w-full max-w-[500px] bg-[#F5E6E0] p-8 sm:p-10">
        
        {/* ข้อความอธิบาย */}
        <p className="text-[1.15rem] leading-relaxed text-[var(--figma-ink)] font-bold">
          You are about DELETE <span className="text-[#CD7A7A]">{hotelName}</span> hotel. 
          This will permanently delete this hotel and related information like Hotel picture, 
          Address and Tags.
        </p>

        {/* ข้อความให้ยืนยัน */}
        <p className="mt-6 text-[1.15rem] text-[var(--figma-ink)] font-bold">
          To confirm, type "{hotelName}"
        </p>

        {/* ช่อง Input (เอา value กับ onChange ออกแล้ว) */}
        <input
          type="text"
          className="mt-4 w-full border-b border-[#B23B47] bg-transparent pb-1 text-[1.15rem] outline-none focus:border-red-700"
        />

        {/* ปุ่มกดยกเลิก / ยืนยัน */}
        <div className="mt-10 flex w-full font-bold">
          {/* ปุ่ม CANCEL */}
            <button className="w-1/2 bg-[#B23B47] py-3 text-[1.15rem] tracking-wider text-white transition-colors hover:bg-red-800 cursor-pointer"
            onClick={() => router.back()}>
                CANCEL
            </button>
          
          {/* ปุ่ม DELETE */}
          <button className="w-1/2 bg-[#FDF6EF] py-3 text-[1.15rem] tracking-wider text-[#B23B47] transition-colors hover:bg-[#f0e4d8] cursor-pointer">
            DELETE
          </button>
        </div>
        
      </div>
    </div>
  );
}