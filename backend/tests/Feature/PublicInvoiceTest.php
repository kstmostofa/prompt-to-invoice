<?php

use App\Models\Invoice;

it('shows a sent invoice by its token without signing in, and records the first view', function () {
    $invoice = Invoice::factory()->sent()->create(['source_prompt' => 'secret prompt']);

    $this->getJson("/v1/public/invoices/{$invoice->public_token}")
        ->assertOk()
        ->assertJsonPath('data.number', $invoice->number)
        ->assertJsonMissingPath('data.source_prompt')
        ->assertJsonMissingPath('data.client_id');

    expect($invoice->fresh()->viewed_at)->not->toBeNull();
});

it('serves the PDF by token', function () {
    $invoice = Invoice::factory()->paid()->create();

    $response = $this->get("/v1/public/invoices/{$invoice->public_token}/pdf")->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
});

it('hides drafts and unknown tokens', function () {
    $draft = Invoice::factory()->create();

    $this->getJson("/v1/public/invoices/{$draft->public_token}")->assertNotFound();
    $this->getJson('/v1/public/invoices/not-a-real-token')->assertNotFound();
});

it('gives every invoice its own token', function () {
    $tokens = Invoice::factory()->count(3)->create()->pluck('public_token');

    expect($tokens->unique())->toHaveCount(3)->and(strlen($tokens->first()))->toBe(40);
});

it('includes the public link for the owner', function () {
    [, $workspace] = signInWithWorkspace();
    $invoice = Invoice::factory()->for($workspace)->create();

    $this->getJson("/v1/invoices/{$invoice->id}")
        ->assertJsonPath('data.public_url', config('app.frontend_url')."/i/{$invoice->public_token}");
});
