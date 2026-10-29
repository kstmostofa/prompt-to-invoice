@php
    // "San Francisco, CA 94105" in North America; "10115 Berlin" in most of Europe.
    $address = function (array $party) use ($countryName): array {
        $city = $party['city'] ?? '';
        $state = $party['state'] ?? '';
        $postal = $party['postal_code'] ?? '';
        $locality = in_array($party['country'] ?? null, ['US', 'CA', 'AU', 'GB', 'IE'], true)
            ? trim(implode(', ', array_filter([$city, trim($state.' '.$postal)])))
            : trim(implode(', ', array_filter([trim($postal.' '.$city), $state])));

        return array_values(array_filter([
            $party['address_line1'] ?? null,
            $party['address_line2'] ?? null,
            $locality,
            $countryName($party['country'] ?? null),
        ]));
    };
    $quantity = fn ($value) => rtrim(rtrim(number_format((float) $value, 2, '.', ','), '0'), '.');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice {{ $invoice->number }}</title>
<style>
    @page { margin: 36px 40px 56px; }
    * { box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1f2937; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; }
    .muted { color: #6b7280; }
    .right { text-align: right; }
    .brand { color: #4f46e5; }
    .header td { vertical-align: top; }
    .logo { max-height: 56px; max-width: 200px; }
    .title { font-size: 26px; font-weight: bold; letter-spacing: 1px; color: #111827; }
    .status { display: inline-block; padding: 3px 9px; border-radius: 10px; font-size: 8.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .6px; }
    .status-draft { background: #f3f4f6; color: #4b5563; }
    .status-sent { background: #e0e7ff; color: #3730a3; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-void { background: #f3f4f6; color: #6b7280; }
    .parties { margin-top: 28px; }
    .parties td { vertical-align: top; width: 33%; padding-right: 16px; }
    .label { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: .8px; color: #6b7280; margin-bottom: 4px; }
    .name { font-size: 11.5px; font-weight: bold; color: #111827; }
    .items { margin-top: 28px; }
    .items th { font-size: 8px; text-transform: uppercase; letter-spacing: .8px; color: #6b7280; text-align: left; padding: 8px 6px; border-bottom: 1.5px solid #111827; }
    .items td { padding: 9px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .items th.right, .items td.right { text-align: right; }
    .totals { margin-top: 14px; }
    .totals td { padding: 4px 6px; }
    .totals .grand td.rule { border-top: 1.5px solid #111827; padding-top: 9px; font-size: 13px; font-weight: bold; color: #111827; }
    .box { margin-top: 24px; padding: 12px 14px; background: #f9fafb; border-radius: 6px; }
    .footer { position: fixed; bottom: -36px; left: 0; right: 0; font-size: 8px; color: #9ca3af; text-align: center; }
    .void-mark { position: fixed; top: 300px; left: 0; right: 0; text-align: center; font-size: 110px; font-weight: bold; color: #ef4444; opacity: .12; transform: rotate(-24deg); }
</style>
</head>
<body>
@if ($status === 'void')
    <div class="void-mark">VOID</div>
@endif

<table class="header">
    <tr>
        <td>
            @if ($logo)
                <img class="logo" src="{{ $logo }}" alt="">
            @else
                <div class="name" style="font-size: 16px;">{{ $from['name'] ?? '' }}</div>
            @endif
        </td>
        <td class="right">
            <div class="title">INVOICE</div>
            <div style="margin-top: 4px; font-size: 11px;">{{ $invoice->number }}</div>
            <div style="margin-top: 6px;"><span class="status status-{{ $status }}">{{ $status }}</span></div>
        </td>
    </tr>
</table>

<table class="parties">
    <tr>
        <td>
            <div class="label">From</div>
            <div class="name">{{ $from['name'] ?? '' }}</div>
            @foreach ($address($from) as $line)
                <div>{{ $line }}</div>
            @endforeach
            @if (! empty($from['email']))<div>{{ $from['email'] }}</div>@endif
            @if (! empty($from['phone']))<div>{{ $from['phone'] }}</div>@endif
            @if (! empty($from['tax_id']))<div class="muted">Tax ID: {{ $from['tax_id'] }}</div>@endif
        </td>
        <td>
            <div class="label">Bill to</div>
            <div class="name">{{ $to['company'] ?? null ?: ($to['name'] ?? '') }}</div>
            @if (! empty($to['company']) && ! empty($to['name']))<div>Attn: {{ $to['name'] }}</div>@endif
            @foreach ($address($to) as $line)
                <div>{{ $line }}</div>
            @endforeach
            @if (! empty($to['email']))<div>{{ $to['email'] }}</div>@endif
            @if (! empty($to['tax_id']))<div class="muted">Tax ID: {{ $to['tax_id'] }}</div>@endif
        </td>
        <td class="right">
            <div class="label">Issue date</div>
            <div style="margin-bottom: 8px;">{{ $invoice->issue_date->format('F j, Y') }}</div>
            <div class="label">Due date</div>
            <div style="margin-bottom: 8px;">{{ $invoice->due_date->format('F j, Y') }}</div>
            <div class="label">Amount due</div>
            <div class="name brand" style="font-size: 15px;">{{ $money($status === 'paid' ? 0 : $invoice->total) }}</div>
        </td>
    </tr>
</table>

<table class="items">
    <thead>
        <tr>
            <th style="width: 52%;">Description</th>
            <th class="right">Qty</th>
            <th class="right">Unit price</th>
            <th class="right">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($invoice->items as $item)
            <tr>
                <td>{{ $item->description }}</td>
                <td class="right">{{ $quantity($item->quantity) }}{{ $item->unit ? ' '.$item->unit : '' }}</td>
                <td class="right">{{ $money($item->unit_price) }}</td>
                <td class="right">{{ $money($item->amount) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr>
        <td style="width: 55%;"></td>
        <td class="muted">Subtotal</td>
        <td class="right">{{ $money($invoice->subtotal) }}</td>
    </tr>
    @if ((float) $invoice->discount_total > 0)
        <tr>
            <td></td>
            <td class="muted">Discount{{ $invoice->discount_type?->value === 'percent' ? ' ('.(float) $invoice->discount_value.'%)' : '' }}</td>
            <td class="right">-{{ $money($invoice->discount_total) }}</td>
        </tr>
    @endif
    @if ($invoice->reverse_charge)
        <tr>
            <td></td>
            <td class="muted">VAT (reverse charge)</td>
            <td class="right">{{ $money(0) }}</td>
        </tr>
    @elseif ((float) $invoice->tax_rate > 0)
        <tr>
            <td></td>
            <td class="muted">Tax ({{ (float) $invoice->tax_rate }}%)</td>
            <td class="right">{{ $money($invoice->tax_total) }}</td>
        </tr>
    @endif
    <tr class="grand">
        <td></td>
        <td class="rule">Total {{ $invoice->currency }}</td>
        <td class="rule right">{{ $money($invoice->total) }}</td>
    </tr>
    @if ($status === 'paid' && $invoice->paid_at)
        <tr>
            <td></td>
            <td class="muted">Paid {{ $invoice->paid_at->format('M j, Y') }}</td>
            <td class="right">-{{ $money($invoice->total) }}</td>
        </tr>
    @endif
</table>

@if ($invoice->reverse_charge)
    <div class="box">Reverse charge: VAT to be accounted for by the recipient (Article 196, Council Directive 2006/112/EC).</div>
@endif

@if ($invoice->notes)
    <div class="box">
        <div class="label">Notes</div>
        <div>{!! nl2br(e($invoice->notes)) !!}</div>
    </div>
@endif

@if ($invoice->footer)
    <div style="margin-top: 18px;" class="muted">{!! nl2br(e($invoice->footer)) !!}</div>
@endif

<div class="footer">{{ $from['name'] ?? '' }} · {{ $invoice->number }}</div>
</body>
</html>
