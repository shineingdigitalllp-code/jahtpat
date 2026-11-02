'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { OrderDetailResponse } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { formatDateTimeIST, formatINR } from '@/lib/format';

export default function OrderPrintPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const { data: order, isLoading } = useQuery<OrderDetailResponse>({
    queryKey: ['admin', 'order', code],
    queryFn: () => apiFetch<OrderDetailResponse>(`/api/v1/admin/orders/${code}`),
  });

  React.useEffect(() => {
    if (order) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order]);

  if (isLoading || !order) {
    return <div className="p-8 text-center text-xs">Loading packing slip...</div>;
  }

  const fullAddress = `${order.address.line1}${
    order.address.line2 ? `, ${order.address.line2}` : ''
  }, ${order.address.city} - ${order.address.pincode}`;

  return (
    <div className="bg-white text-black font-mono text-[11px] leading-tight p-4 max-w-[80mm] mx-auto print:p-0 print:max-w-none">
      <div className="text-center pb-2 border-b border-black border-dashed">
        <div className="text-lg font-bold uppercase tracking-wider">JHATPAT</div>
        <div className="text-[10px]">Express Grocery Delivery · Kota</div>
        <div className="mt-1 font-bold text-sm">PACKING SLIP</div>
      </div>

      <div className="py-2 border-b border-black border-dashed space-y-1">
        <div className="flex justify-between">
          <span>ORDER:</span>
          <span className="font-bold">{order.code}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>DATE:</span>
          <span>{formatDateTimeIST(order.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>PAYMENT:</span>
          <span className="font-bold uppercase">
            {order.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : `PAID (${order.paymentMethod})`}
          </span>
        </div>
      </div>

      <div className="py-2 border-b border-black border-dashed space-y-0.5">
        <div className="font-bold">DELIVER TO:</div>
        <div>{order.user.name} ({order.user.mobile})</div>
        <div className="text-[10px] break-words">{fullAddress}</div>
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-black border-dashed">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black">
              <th className="py-1">QTY</th>
              <th className="py-1">ITEM</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/20">
            {order.items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="py-1 font-bold">{item.qty}x</td>
                <td className="py-1 pr-1">
                  <div>{item.name}</div>
                  <div className="text-[9px] text-gray-600">{item.unit}</div>
                </td>
                <td className="py-1 text-right tabular-nums">
                  {formatINR(item.lineTotalPaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price Summary */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatINR(order.subtotalPaise + order.discountPaise)}</span>
        </div>
        {order.discountPaise > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatINR(order.discountPaise)}</span>
          </div>
        )}
        {order.couponPaise > 0 && (
          <div className="flex justify-between">
            <span>Coupon ({order.couponCode}):</span>
            <span>-{formatINR(order.couponPaise)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery:</span>
          <span>{order.deliveryPaise === 0 ? 'FREE' : formatINR(order.deliveryPaise)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>{formatINR(order.totalPaise)}</span>
        </div>
      </div>

      <div className="pt-3 text-center text-[10px] space-y-1">
        <div>Thank you for choosing Jhatpat!</div>
        <div>Need help? Support: support@jhatpat.in</div>
      </div>
    </div>
  );
}

