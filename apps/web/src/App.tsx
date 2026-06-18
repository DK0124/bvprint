import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { makePrintSeq } from '@bvprint/print-core';
import { createPrintJob, fetchOrders, generatePdf } from './api.js';
import type { OrderRow } from './types.js';

const formSchema = z.object({
  senderName: z.string().min(1, '必填'),
  senderPhone: z.string().min(1, '必填'),
  paperSize: z.enum(['THERMAL_100X150', 'A4', 'A5', 'ROLL_80MM']),
  mode: z.enum(['PAIR', 'LABELS_FIRST', 'SLIPS_FIRST']),
});

type FormValues = z.infer<typeof formSchema>;

function SortableRow({
  order,
  selected,
  seq,
  onToggle,
}: {
  order: OrderRow;
  selected: boolean;
  seq: string;
  onToggle: (id: number, checked: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(order.id) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <input type="checkbox" checked={selected} onChange={(e) => onToggle(order.id, e.target.checked)} />
      </td>
      <td>
        <button type="button" {...attributes} {...listeners}>
          ↕
        </button>
      </td>
      <td>{seq}</td>
      <td>{order.id}</td>
      <td>{order.uid}</td>
      <td>{order.receiverName}</td>
      <td>{order.logisticMethod}</td>
      <td>{order.paymentStatus}</td>
      <td>{order.logisticStatus}</td>
    </tr>
  );
}

export function App() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [jobId, setJobId] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    startAt: '',
    endAt: '',
    orderStatus: '',
    paymentStatus: '',
    logisticStatus: '',
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: '',
      senderPhone: '',
      paperSize: 'THERMAL_100X150',
      mode: 'PAIR',
    },
  });

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)),
    [orders, selectedIds],
  );

  async function onSearch() {
    const next = await fetchOrders(
      Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim() !== '')),
    );
    setOrders(next);
    setSelectedIds([]);
  }

  function onToggle(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return [...new Set([...prev, id])];
      return prev.filter((item) => item !== id);
    });
  }

  function onSelectAll(checked: boolean) {
    setSelectedIds(checked ? orders.map((order) => order.id) : []);
  }

  async function onCreateJob(values: FormValues) {
    const result = await createPrintJob({
      orderIds: selectedOrders.map((order) => order.id),
      senderName: values.senderName,
      senderPhone: values.senderPhone,
      paperSize: values.paperSize,
      mode: values.mode,
    });
    setJobId(result.jobId);
    setWarnings(result.warnings ?? []);
  }

  async function onGeneratePdf() {
    if (!jobId) return;
    const blob = await generatePdf(jobId, true);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="container">
      <h1>BVSHOP 出貨列印助手</h1>

      <section>
        <h2>篩選條件</h2>
        <div className="filters">
          <label>
            起始日
            <input type="date" value={filters.startAt} onChange={(e) => setFilters({ ...filters, startAt: e.target.value })} />
          </label>
          <label>
            結束日
            <input type="date" value={filters.endAt} onChange={(e) => setFilters({ ...filters, endAt: e.target.value })} />
          </label>
          <label>
            訂單狀態
            <input value={filters.orderStatus} onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })} />
          </label>
          <label>
            付款狀態
            <input value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} />
          </label>
          <label>
            出貨狀態
            <input value={filters.logisticStatus} onChange={(e) => setFilters({ ...filters, logisticStatus: e.target.value })} />
          </label>
          <button type="button" onClick={onSearch}>
            查詢訂單
          </button>
        </div>
      </section>

      <section>
        <h2>訂單列表</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = orders.findIndex((order) => String(order.id) === active.id);
            const newIndex = orders.findIndex((order) => String(order.id) === over.id);
            setOrders((prev) => arrayMove(prev, oldIndex, newIndex));
          }}
        >
          <SortableContext items={orders.map((order) => String(order.id))} strategy={verticalListSortingStrategy}>
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedIds.length === orders.length}
                      onChange={(e) => onSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>排序</th>
                  <th>流水號預覽</th>
                  <th>訂單 ID</th>
                  <th>訂單編號</th>
                  <th>收件人</th>
                  <th>物流方式</th>
                  <th>付款狀態</th>
                  <th>出貨狀態</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const seqIndex = selectedOrders.findIndex((selected) => selected.id === order.id);
                  const seq = seqIndex >= 0 ? makePrintSeq(seqIndex + 1, selectedOrders.length) : '-';
                  return (
                    <SortableRow
                      key={order.id}
                      order={order}
                      selected={selectedIds.includes(order.id)}
                      seq={seq}
                      onToggle={onToggle}
                    />
                  );
                })}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </section>

      <section>
        <h2>列印設定</h2>
        <form onSubmit={handleSubmit(onCreateJob)} className="form-grid">
          <label>
            寄件人姓名
            <input {...register('senderName')} />
          </label>
          <label>
            寄件人電話
            <input {...register('senderPhone')} />
          </label>
          <label>
            紙張
            <select {...register('paperSize')}>
              <option value="THERMAL_100X150">THERMAL_100X150</option>
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="ROLL_80MM">ROLL_80MM</option>
            </select>
          </label>
          <label>
            排序模式
            <select {...register('mode')}>
              <option value="PAIR">PAIR</option>
              <option value="LABELS_FIRST">LABELS_FIRST</option>
              <option value="SLIPS_FIRST">SLIPS_FIRST</option>
            </select>
          </label>

          <div>
            <button type="submit" disabled={selectedOrders.length === 0 || formState.isSubmitting}>
              建立列印任務
            </button>
            <button type="button" disabled={!jobId} onClick={onGeneratePdf}>
              產生 PDF
            </button>
          </div>
        </form>
      </section>

      {jobId ? <p>目前任務: {jobId}</p> : null}
      {warnings.length ? (
        <section>
          <h2>警告</h2>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
