<?php

use App\Mail\InvoiceMail;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Mail::fake();
    [$this->user, $this->workspace] = signInWithWorkspace();
    BusinessProfile::factory()->for($this->workspace)->create(['name' => 'Studio LLC', 'email' => 'billing@studio.test']);
    $client = Client::factory()->for($this->workspace)->create();
    $this->invoice = Invoice::factory()->for($this->workspace)->create([
        'client_id' => $client->id,
        'from_details' => ['name' => 'Studio LLC', 'email' => 'billing@studio.test'],
    ]);
});

function emailPayload(array $overrides = []): array
{
    return [
        'to' => 'client@acme.test',
        'cc' => ['ap@acme.test'],
        'subject' => 'Invoice from Studio LLC',
        'message' => "Hi Jane,\nHere is your invoice.",
        ...$overrides,
    ];
}

it('emails the invoice with the PDF and marks a draft as sent', function () {
    $this->postJson("/v1/invoices/{$this->invoice->id}/email", emailPayload())
        ->assertOk()
        ->assertJsonPath('data.status', 'sent')
        ->assertJsonPath('data.last_emailed_to', 'client@acme.test');

    Mail::assertQueued(InvoiceMail::class, function (InvoiceMail $mail) {
        $attachment = $mail->attachments()[0];

        return $attachment->as === "Invoice {$this->invoice->number}.pdf"
            && $attachment->mime === 'application/pdf'
            && $mail->hasTo('client@acme.test')
            && $mail->hasCc('ap@acme.test')
            && $mail->hasReplyTo('billing@studio.test')
            && $mail->mailSubject === 'Invoice from Studio LLC';
    });
});

it('renders the email with the amount and the public link', function () {
    $mail = new InvoiceMail($this->invoice, 'Invoice', 'Hello there');

    $mail->assertSeeInHtml('Hello there')
        ->assertSeeInHtml($this->invoice->number)
        ->assertSeeInHtml($this->invoice->publicUrl());
});

it('requires a verified email address to send', function () {
    $this->user->forceFill(['email_verified_at' => null])->save();
    Sanctum::actingAs($this->user);

    $this->postJson("/v1/invoices/{$this->invoice->id}/email", emailPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors('to');

    Mail::assertNothingQueued();
});

it('does not send void invoices', function () {
    $this->invoice->update(['status' => 'void']);

    $this->postJson("/v1/invoices/{$this->invoice->id}/email", emailPayload())->assertUnprocessable();
    Mail::assertNothingQueued();
});

it('validates recipients', function () {
    $this->postJson("/v1/invoices/{$this->invoice->id}/email", emailPayload(['to' => 'nope', 'cc' => ['bad']]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['to', 'cc.0']);
});

it('cannot email another workspace invoice', function () {
    $foreign = Invoice::factory()->create();

    $this->postJson("/v1/invoices/{$foreign->id}/email", emailPayload())->assertNotFound();
    Mail::assertNothingQueued();
});
