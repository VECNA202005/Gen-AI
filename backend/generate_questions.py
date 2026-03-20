import json
from pathlib import Path

roles=[
    'software_engineer','backend_developer','frontend_developer','full_stack_developer',
    'web_developer','mobile_app_developer','data_analyst','data_scientist','business_analyst','data_engineer'
]

base_templates={
    'software_engineer': [
        ('Explain your process for designing modular architecture', ['architecture','modularity','scalability','separation of concerns']),
        ('How do you ensure code quality in rapidly changing projects?', ['testing','CI/CD','code review','standards']),
        ('Discuss handling production incidents and postmortems', ['incident response','postmortem','reliability','blameless'])
    ],
    'backend_developer': [
        ('Design a rate-limited API for a high-traffic service', ['rate limiting','throughput','backend','security']),
        ('Explain database sharding strategies and tradeoffs', ['sharding','partitioning','database','scalability']),
        ('How would you implement distributed transactions safely?', ['transactions','two-phase commit','consistency','ACID'])
    ],
    'frontend_developer': [
        ('Describe a difficult cross-browser issue and fix', ['cross-browser','debugging','CSS','compatibility']),
        ('How do you optimize app load performance?', ['performance','lazy loading','bundle splitting','network']),
        ('Explain accessibility best practices for UI', ['accessibility','a11y','ARIA','keyboard navigation'])
    ],
    'full_stack_developer': [
        ('Design a real-time notifications system', ['WebSocket','realtime','backend','frontend']),
        ('Explain coordinating API and UI changes in agile teams', ['API','frontend','integration','rollback']),
        ('Discuss security considerations for end-to-end flows', ['authentication','authorization','encryption','scope'])
    ],
    'web_developer': [
        ('Describe progressive web app architecture and features', ['PWA','service worker','offline','manifest']),
        ('How do you optimize first contentful paint?', ['FCP','critical CSS','resources','minification']),
        ('Explain SEO technical best practices for dynamic sites', ['SEO','meta','schema','site map'])
    ],
    'mobile_app_developer': [
        ('Design an offline-first mobile app architecture', ['offline','sync','caching','local storage']),
        ('How do you optimize memory and battery usage?', ['memory','battery','profiling','efficiency']),
        ('Explain push notification security and reliability', ['push','APNs','FCM','security'])
    ],
    'data_analyst': [
        ('Explain your process for deriving insights from messy data', ['ETL','cleaning','analysis','storytelling']),
        ('How do you validate a hypothesis with data?', ['hypothesis','A/B test','significance','metrics']),
        ('Discuss working with cross-functional stakeholders', ['communication','visualization','impact','reports'])
    ],
    'data_scientist': [
        ('Design a machine learning model for churn prediction', ['classification','features','evaluation','AUC']),
        ('Explain dealing with imbalanced datasets', ['resampling','class weights','ROC','precision']),
        ('How do you avoid model overfitting?', ['regularization','cross-validation','features','validation'])
    ],
    'business_analyst': [
        ('Describe how you gather business requirements', ['stakeholders','interviews','documents','synthesis']),
        ('Explain prioritizing features for MVP', ['value','effort','RICE','roadmap']),
        ('How do you measure business outcomes?', ['KPIs','OKR','ROI','dashboards'])
    ],
    'data_engineer': [
        ('Design a data pipeline for streaming ingestion', ['Kafka','ETL','pipeline','latency']),
        ('Explain data warehouse vs data lake tradeoffs', ['warehouse','lake','schema','governance']),
        ('How do you ensure data quality in pipelines?', ['validation','monitoring','reconciliation','schema'])
    ]
}

questions={}
for role in roles:
    templates=base_templates.get(role, [('Describe key responsibilities of the role', ['general','role'])])
    role_questions=[]
    for i in range(40):
        q_base, kws = templates[i % len(templates)]
        if i < len(templates):
            q_text=q_base
        else:
            q_text=f"{q_base} - Advanced scenario #{i+1}"
        tags = list(dict.fromkeys(kws + ['design','scalability','reliability']))
        question = {'question': q_text, 'keywords': tags[:6]}
        role_questions.append(question)
    questions[role]=role_questions

Path('questions.json').write_text(json.dumps(questions, indent=2), encoding='utf-8')
print('Generated', sum(len(v) for v in questions.values()), 'questions')
