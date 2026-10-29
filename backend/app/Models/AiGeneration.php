<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;

class AiGeneration extends Model
{
    use BelongsToWorkspace;

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUSED = 'refused';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'user_id',
        'prompt',
        'model',
        'status',
        'input_tokens',
        'output_tokens',
        'duration_ms',
        'error',
    ];
}
