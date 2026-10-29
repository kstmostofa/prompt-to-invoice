<x-mail::message>
{!! nl2br(e($body)) !!}

<x-mail::panel>
**Invoice {{ $number }}**<br>
@if ($paid)
Amount paid: **{{ $amount }}**
@else
Amount due: **{{ $amount }}** by {{ $dueDate }}
@endif
</x-mail::panel>

<x-mail::button :url="$url">
View invoice
</x-mail::button>

The invoice is also attached as a PDF.

{{ $business }}
</x-mail::message>
